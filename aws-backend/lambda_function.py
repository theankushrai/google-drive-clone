import os
import json
import boto3
from datetime import datetime
import uuid
import base64
import firebase_admin
from firebase_admin import auth, credentials

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('FILES_TABLE_NAME'))

# Initialize Firebase Admin
firebase_creds = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT', '{}'))
if firebase_creds:
    cred = credentials.Certificate(firebase_creds)
    firebase_admin.initialize_app(cred)

def lambda_handler(event, context):
    print("Received event: " + json.dumps(event, indent=2))
    
    try:
        http_method = event['requestContext']['http']['method']
        path = event['requestContext']['http']['path']
        
        # Parse request body if it exists
        body = json.loads(event['body']) if 'body' in event and event['body'] else {}
        
        # Route the request
        if http_method == 'POST' and path == '/auth':
            return handle_auth(body)
        elif http_method == 'POST' and path == '/files':
            headers = {k.lower(): v for k, v in event['headers'].items()}
            return handle_file_upload(body, headers)
        elif http_method == 'GET' and path == '/files':
            headers = {k.lower(): v for k, v in event['headers'].items()}
            return list_user_files(headers)
        elif http_method == 'GET' and path.startswith('/files/') and 'pathParameters' in event:
            file_id = event['pathParameters'].get('fileId')
            if file_id:
                headers = {k.lower(): v for k, v in event['headers'].items()}
                return get_file(file_id, headers)
        elif http_method == 'DELETE' and path.startswith('/files/') and 'pathParameters' in event:
            file_id = event['pathParameters'].get('fileId')
            if file_id:
                headers = {k.lower(): v for k, v in event['headers'].items()}
                return delete_file(file_id, headers)
        
        return create_response(404, {'error': 'Not Found'})
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal Server Error', 'details': str(e)})

def handle_auth(request_body):
    token = request_body.get('token')
    if not token:
        return create_response(400, {'error': 'Token is required'})
    
    try:
        decoded_token = auth.verify_id_token(token)
        return create_response(200, {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email', ''),
            'name': decoded_token.get('name', ''),
            'picture': decoded_token.get('picture', '')
        })
    except Exception as e:
        print(f"Auth error: {str(e)}")
        return create_response(401, {'error': 'Authentication failed'})

def handle_file_upload(request_body, headers):
    file_content = request_body.get('fileContent')
    file_name = request_body.get('fileName')
    file_type = request_body.get('fileType', 'application/octet-stream')
    user_id = get_user_id_from_headers(headers)
    
    if not file_content or not file_name:
        return create_response(400, {'error': 'File content and name are required'})
    
    try:
        file_id = str(uuid.uuid4())
        file_key = f"{user_id}/{file_id}/{file_name}"
        file_data = base64.b64decode(file_content)
        
        # Upload to S3
        s3.put_object(
            Bucket=os.environ.get('FILE_BUCKET_NAME', 'google-drive-clone-files'),
            Key=file_key,
            Body=file_data,
            ContentType=file_type
        )
        
        # Save metadata to DynamoDB
        item = {
            'fileId': file_id,
            'userId': user_id,
            'fileName': file_name,
            'fileKey': file_key,
            'fileType': file_type,
            'fileSize': len(file_data),
            'uploadDate': datetime.utcnow().isoformat()
        }
        table.put_item(Item=item)
        
        return create_response(200, {
            'message': 'File uploaded successfully',
            'fileId': file_id,
            'fileName': file_name
        })
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return create_response(500, {'error': 'Failed to upload file'})

def list_user_files(headers):
    user_id = get_user_id_from_headers(headers)
    
    try:
        response = table.scan(
            FilterExpression='userId = :userId',
            ExpressionAttributeValues={':userId': user_id}
        )
        
        files = [{
            'fileId': item['fileId'],
            'fileName': item['fileName'],
            'fileType': item.get('fileType', ''),
            'fileSize': item.get('fileSize', 0),
            'uploadDate': item.get('uploadDate', '')
        } for item in response.get('Items', [])]
        
        return create_response(200, {'files': files})
        
    except Exception as e:
        print(f"List files error: {str(e)}")
        return create_response(500, {'error': 'Failed to list files'})

def get_file(file_id, headers):
    user_id = get_user_id_from_headers(headers)
    
    try:
        # Get file metadata
        response = table.get_item(
            Key={'userId': user_id, 'fileId': file_id}
        )
        
        if 'Item' not in response:
            return create_response(404, {'error': 'File not found'})
        
        item = response['Item']
        
        # Generate pre-signed URL for download
        url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': os.environ.get('FILE_BUCKET_NAME', 'google-drive-clone-files'),
                'Key': item['fileKey']
            },
            ExpiresIn=3600  # 1 hour
        )
        
        # Return file metadata with download URL
        return create_response(200, {
            **item,
            'downloadUrl': url
        })
        
    except Exception as e:
        print(f"Get file error: {str(e)}")
        return create_response(500, {'error': 'Failed to get file'})

def delete_file(file_id, headers):
    user_id = get_user_id_from_headers(headers)
    
    try:
        # Get file metadata first
        response = table.get_item(
            Key={'userId': user_id, 'fileId': file_id}
        )
        
        if 'Item' not in response:
            return create_response(404, {'error': 'File not found'})
        
        item = response['Item']
        
        # Delete from S3
        s3.delete_object(
            Bucket=os.environ.get('FILE_BUCKET_NAME', 'google-drive-clone-files'),
            Key=item['fileKey']
        )
        
        # Delete from DynamoDB
        table.delete_item(
            Key={'userId': user_id, 'fileId': file_id}
        )
        
        return create_response(200, {'message': 'File deleted successfully'})
        
    except Exception as e:
        print(f"Delete file error: {str(e)}")
        return create_response(500, {'error': 'Failed to delete file'})

def get_user_id_from_headers(headers):
    # This assumes you're using API Gateway with a Cognito Authorizer
    # which adds the user ID to the request context
    return (headers.get('x-user-id') or 
            headers.get('authorization', '').split(' ')[-1] or 
            'anonymous')

def create_response(status_code, body, headers=None):
    """
    Create a standardized API response with CORS headers
    
    Args:
        status_code (int): HTTP status code
        body (dict): Response body to be JSON-serialized
        headers (dict, optional): Additional headers to include
        
    Returns:
        dict: Formatted API Gateway response
    """
    # Default CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
    
    # Merge with any additional headers
    if headers and isinstance(headers, dict):
        cors_headers.update(headers)
    
    # Ensure body is properly serialized
    try:
        body_str = json.dumps(body) if body is not None else ''
    except (TypeError, ValueError) as e:
        print(f"Error serializing response body: {str(e)}")
        body_str = json.dumps({'error': 'Failed to serialize response'})
        status_code = 500
    
    return {
        'statusCode': status_code,
        'headers': cors_headers,
        'body': body_str,
        'isBase64Encoded': False
    }