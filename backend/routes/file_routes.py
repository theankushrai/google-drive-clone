import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from firebase_admin import auth
import boto3
from botocore.exceptions import ClientError
from auth.firebase import token_required

# Create a Blueprint for file-related routes
file_bp = Blueprint('files', __name__)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserFiles')

def get_s3_bucket_name():
    """Get the S3 bucket name from environment variables"""
    bucket_name = os.getenv('S3_BUCKET_NAME')
    if not bucket_name:
        raise ValueError("S3_BUCKET_NAME environment variable not set")
    return bucket_name

@file_bp.route('/upload', methods=['POST'])
@token_required
def upload_file():
    """
    Handle file upload
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    try:
        # Get user ID from the Firebase token (already verified by @token_required)
        user_id = request.decoded_token['uid']
        
        # Generate a unique file ID and secure the filename
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        
        # Create S3 key (path in the bucket)
        s3_key = f"{user_id}/{file_id}/{filename}"
        
        # Get the S3 bucket name
        bucket_name = get_s3_bucket_name()
        
        # Upload file to S3
        s3_client.upload_fileobj(
            file,
            bucket_name,
            s3_key,
            ExtraArgs={
                'ContentType': file.content_type or 'application/octet-stream',
                'ACL': 'private'
            }
        )
        
        # Generate a pre-signed URL for the file
        file_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': bucket_name,
                'Key': s3_key
            },
            ExpiresIn=3600  # URL expires in 1 hour
        )
        
        # Store file metadata in DynamoDB
        current_time = datetime.utcnow().isoformat()
        table.put_item(Item={
            'userId': user_id,
            'fileId': file_id,
            'filename': filename,
            's3Key': s3_key,
            'size': request.content_length or 0,
            'contentType': file.content_type or 'application/octet-stream',
            'uploadedAt': current_time,
            'lastModified': current_time
        })
        
        return jsonify({
            'message': 'File uploaded successfully',
            'fileId': file_id,
            'filename': filename,
            'url': file_url,
            'size': request.content_length or 0,
            'contentType': file.content_type or 'application/octet-stream'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error uploading file: {str(e)}")
        return jsonify({
            'error': 'Failed to upload file',
            'details': str(e)
        }), 500

@file_bp.route('', methods=['GET'])
@token_required
def list_files():
    """
    List all files for the authenticated user
    """
    try:
        # Get user ID from the Firebase token
        token = request.headers.get('Authorization').split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        
        # Query DynamoDB for user's files
        response = table.query(
            KeyConditionExpression='userId = :userId',
            ExpressionAttributeValues={
                ':userId': user_id
            },
            ScanIndexForward=False  # Sort by sort key (uploadedAt) in descending order
        )
        
        # Format the response
        files = []
        for item in response.get('Items', []):
            files.append({
                'fileId': item['fileId'],
                'filename': item['filename'],
                'size': item.get('size', 0),
                'contentType': item.get('contentType', ''),
                'uploadedAt': item['uploadedAt'],
                'lastModified': item.get('lastModified', item['uploadedAt'])
            })
        
        return jsonify(files)
        
    except Exception as e:
        current_app.logger.error(f"Error listing files: {str(e)}")
        return jsonify({'error': 'Failed to list files'}), 500

@file_bp.route('/<string:file_id>', methods=['GET'])
@token_required
def get_file(file_id):
    """
    Generate a pre-signed URL for downloading a file
    """
    try:
        # Get user ID from the token
        user_id = request.decoded_token['uid']
        
        # Query the file metadata from DynamoDB
        response = table.get_item(
            Key={
                'userId': user_id,
                'fileId': file_id
            }
        )
        
        if 'Item' not in response:
            return jsonify({'error': 'File not found or access denied'}), 404
            
        file_item = response['Item']
        
        # Generate a pre-signed URL for the file
        bucket_name = get_s3_bucket_name()
        s3_key = f"{user_id}/{file_id}/{file_item['filename']}"
        
        try:
            # Check if file exists and user has permission
            s3_client.head_object(Bucket=bucket_name, Key=s3_key)
            
            # Generate pre-signed URL (valid for 1 hour)
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': bucket_name,
                    'Key': s3_key,
                    'ResponseContentDisposition': f'attachment; filename="{file_item["filename"]}"'
                },
                ExpiresIn=3600
            )
            
            return jsonify({
                'url': presigned_url,
                'filename': file_item['filename'],
                'contentType': file_item.get('contentType', 'application/octet-stream')
            })
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return jsonify({'error': 'File not found in storage'}), 404
            raise
            
    except Exception as e:
        current_app.logger.error(f"Error generating download URL: {str(e)}")
        return jsonify({'error': 'Failed to generate download URL'}), 500

@file_bp.route('/<string:file_id>', methods=['DELETE'])
@token_required
def delete_file(file_id):
    """
    Delete a file and its metadata
    """
    try:
        # Get user ID from the token
        user_id = request.decoded_token['uid']
        
        # First, get the file metadata to get the filename
        response = table.get_item(
            Key={
                'userId': user_id,
                'fileId': file_id
            }
        )
        
        if 'Item' not in response:
            return jsonify({'error': 'File not found or access denied'}), 404
            
        file_item = response['Item']
        
        # Delete from S3
        bucket_name = get_s3_bucket_name()
        s3_key = f"{user_id}/{file_id}/{file_item['filename']}"
        
        try:
            # Delete the file from S3
            s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
            
            # Delete the metadata from DynamoDB
            table.delete_item(
                Key={
                    'userId': user_id,
                    'fileId': file_id
                }
            )
            
            return jsonify({'message': 'File deleted successfully'})
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                # File doesn't exist in S3, but we'll still delete the metadata
                current_app.logger.warning(f"File {file_id} not found in S3, but deleting metadata")
                table.delete_item(
                    Key={
                        'userId': user_id,
                        'fileId': file_id
                    }
                )
                return jsonify({'message': 'File metadata deleted (file not found in storage)'})
            raise
            
    except Exception as e:
        current_app.logger.error(f"Error deleting file: {str(e)}")
        return jsonify({'error': 'Failed to delete file'}), 500
