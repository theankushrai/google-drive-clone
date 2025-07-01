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
table = dynamodb.Table(os.environ.get('FILES_TABLE_NAME', 'UserFiles'))

# Initialize Firebase Admin (only if credentials are provided)
firebase_creds = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT', '{}'))
if firebase_creds and not firebase_admin._apps:
    cred = credentials.Certificate(firebase_creds)
    firebase_admin.initialize_app(cred)

def create_response(status_code, body, headers=None):
    """Create a properly formatted HTTP response with CORS headers."""
    # Default headers with CORS support
    response_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true'
    }
    
    # Add any additional headers if provided
    if headers and isinstance(headers, dict):
        response_headers.update(headers)
    
    # Handle response body
    body_str = ''
    if body is not None:
        try:
            if isinstance(body, (dict, list)):
                body_str = json.dumps(body)
            else:
                body_str = str(body)
        except Exception as e:
            print(f"Error serializing response: {str(e)}")
            body_str = json.dumps({'error': 'Failed to serialize response'})
            status_code = 500
    
    return {
        'statusCode': status_code,
        'headers': response_headers,
        'body': body_str
    }

def get_user_id_from_headers(headers):
    """Extract and verify user ID from Authorization header."""
    auth_header = headers.get('authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
        
    try:
        token = auth_header.split(' ')[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

def handle_auth(request_body):
    """Handle user authentication with Firebase."""
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

def parse_multipart_form_data(body, headers, is_base64_encoded=False):
    """Parse multipart/form-data request body with proper binary handling."""
    print("Starting multipart form data parsing...")
    try:
        content_type = headers.get('content-type', '')
        print(f"Content-Type: {content_type}")
        if 'multipart/form-data' not in content_type:
            error_msg = f'Content-Type must be multipart/form-data, got {content_type}'
            print(error_msg)
            return None, None, None, error_msg
            
        # Get boundary from content-type
        boundary = None
        for part in content_type.split(';'):
            part = part.strip()
            if part.startswith('boundary='):
                boundary = '--' + part[9:].strip('\'"')  # Add -- prefix if not present
                print(f"Found boundary: {boundary}")
                break
                
        if not boundary:
            error_msg = 'No boundary found in Content-Type'
            print(error_msg)
            return None, None, None, error_msg

        # Get raw body
        try:
            print(f"is_base64_encoded: {is_base64_encoded}")
            print(f"Body type: {type(body)}")
            print(f"Body length: {len(body) if hasattr(body, '__len__') else 'N/A'}")
            
            if is_base64_encoded:
                print("Decoding base64 body...")
                try:
                    body = base64.b64decode(body)
                    print("Successfully decoded base64 body")
                except Exception as e:
                    error_msg = f'Error decoding base64 body: {str(e)}'
                    print(error_msg)
                    return None, None, None, error_msg
            
            if not isinstance(body, bytes):
                print("Converting body to bytes...")
                try:
                    body = body.encode('latin-1')
                except Exception as e:
                    error_msg = f'Error encoding body to bytes: {str(e)}'
                    print(error_msg)
                    return None, None, None, error_msg

            # Split into parts using binary boundary
            print(f"Splitting body with boundary: {boundary}")
            boundary_bytes = boundary.encode('latin-1')
            parts = body.split(boundary_bytes)
            print(f"Split into {len(parts)} parts")
            
            if len(parts) < 3:  # Should have at least 3 parts (preamble, content, epilogue)
                error_msg = f'Invalid multipart format: not enough parts (got {len(parts)} parts, expected at least 3)'
                print(error_msg)
                return None, None, None, error_msg
                
        except Exception as e:
            error_msg = f'Error processing request body: {str(e)}'
            print(error_msg)
            import traceback
            print(traceback.format_exc())
            return None, None, None, error_msg
            
        file_content = None
        file_name = None
        content_type = 'application/octet-stream'
        
        print(f"Processing {len(parts) - 2} parts (excluding boundary parts)")
        
        # Process each part (skip first and last empty parts)
        for i, part in enumerate(parts[1:-1], 1):
            print(f"\n--- Processing part {i} ---")
            try:
                # Clean up the part
                part = part.strip(b'\r\n')
                if not part:
                    print("Empty part, skipping")
                    continue
                
                print(f"Part size: {len(part)} bytes")
                
                # Split headers from content
                try:
                    header_data, content = part.split(b'\r\n\r\n', 1)
                    print(f"Headers size: {len(header_data)} bytes")
                    print(f"Content size: {len(content)} bytes")
                    
                    headers = {}
                    print("Parsing headers...")
                    
                    # Parse headers
                    for j, header_line in enumerate(header_data.split(b'\r\n'), 1):
                        if b':' not in header_line:
                            print(f"  Skipping malformed header line {j}")
                            continue
                        try:
                            name, value = header_line.split(b':', 1)
                            name = name.strip().lower()
                            value = value.strip()
                            headers[name] = value
                            print(f"  Header: {name.decode('latin-1')}: {value.decode('latin-1', errors='replace')}")
                        except Exception as e:
                            print(f"  Warning: Error parsing header line {j}: {str(e)}")
                            print(f"  Header line content: {header_line}")
                    
                    # Check if this is a file part
                    if b'content-disposition' in headers:
                        print("Found content-disposition header")
                        try:
                            disposition = headers[b'content-disposition'].decode('latin-1', errors='replace')
                            print(f"  Disposition: {disposition}")
                            
                            if 'filename=' in disposition:
                                # Extract filename
                                file_name = disposition.split('filename=')[1].split(';')[0].strip('"\'')
                                print(f"  Found file: {file_name}")
                                
                                # Get content type if available
                                if b'content-type' in headers:
                                    content_type = headers[b'content-type'].decode('latin-1', errors='replace')
                                    print(f"  Content-Type: {content_type}")
                                
                                # Get file content (remove trailing \r\n-- if present)
                                file_content = content.rstrip(b'\r\n-')
                                print(f"  File content size: {len(file_content)} bytes")
                                
                                # Found our file, no need to check other parts
                                break  
                                
                        except Exception as e:
                            error_msg = f"Error parsing content-disposition: {str(e)}"
                            print(f"  {error_msg}")
                            import traceback
                            print(traceback.format_exc())
                            continue
                    else:
                        print("No content-disposition header found in this part")
                        
                except Exception as e:
                    error_msg = f"Error splitting headers from content: {str(e)}"
                    print(error_msg)
                    import traceback
                    print(traceback.format_exc())
                    continue
                    
            except Exception as e:
                error_msg = f"Unexpected error processing part {i}: {str(e)}"
                print(error_msg)
                import traceback
                print(traceback.format_exc())
                continue
        
        if not file_content or not file_name:
            return None, None, None, 'No valid file found in multipart data'
            
        return file_content, file_name, content_type, None
        
    except Exception as e:
        error_msg = f'Error parsing multipart data: {str(e)}'
        print(error_msg)
        return None, None, None, error_msg

def handle_file_upload(event, headers):
    """Handle file upload to S3 and save metadata to DynamoDB."""
    user_id = get_user_id_from_headers(headers)
    if not user_id:
        return create_response(401, {'error': 'Unauthorized'})

    # Get the raw request body
    request_body = event.get('body', '')
    is_base64_encoded = event.get('isBase64Encoded', False)
    
    # Check if this is a multipart form data request
    content_type = headers.get('content-type', '').lower()
    if 'multipart/form-data' in content_type:
        file_content, file_name, file_type, error = parse_multipart_form_data(
            request_body, 
            headers, 
            is_base64_encoded
        )
        if error:
            print(f"Error parsing form data: {error}")
            return create_response(400, {'error': error})
    else:
        # Handle JSON request (for backward compatibility)
        try:
            if is_base64_encoded:
                request_body = base64.b64decode(request_body).decode('utf-8')
            if isinstance(request_body, str):
                request_body = json.loads(request_body)
            
            file_content = request_body.get('fileContent')
            file_name = request_body.get('fileName')
            file_type = request_body.get('fileType', 'application/octet-stream')
            
            if file_content:
                if not isinstance(file_content, bytes):
                    file_content = base64.b64decode(file_content)
        except Exception as e:
            print(f"Error processing request body: {str(e)}")
            return create_response(400, {'error': 'Invalid request body'})
    
    if not file_content or not file_name:
        return create_response(400, {'error': 'File content and name are required'})
    
    try:
        file_id = str(uuid.uuid4())
        file_key = f"{user_id}/{file_id}/{file_name}"
        
        # Ensure file_content is bytes
        if not isinstance(file_content, bytes):
            file_content = file_content.encode('latin-1')
            
        file_data = file_content
        
        # Upload to S3
        s3.put_object(
            Bucket=os.environ.get('FILE_BUCKET_NAME', 'google-drive-clone-files'),
            Key=file_key,
            Body=file_data,
            ContentType=file_type
        )
        
        # Calculate TTL (1 day from now in seconds since epoch)
        ttl_days = 1  # Set TTL to 1 day
        ttl_timestamp = int((datetime.utcnow().timestamp() + (ttl_days * 24 * 60 * 60)))
        
        # Save metadata to DynamoDB with TTL
        item = {
            'fileId': file_id,
            'userId': user_id,
            'fileName': file_name,
            'fileKey': file_key,
            'fileType': file_type,
            'fileSize': len(file_data),
            'uploadDate': datetime.utcnow().isoformat(),
            'expiresAt': ttl_timestamp  # TTL attribute for DynamoDB
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
    """List all files for the authenticated user."""
    try:
        print("List files headers:", json.dumps(headers, default=str))
        user_id = get_user_id_from_headers(headers)
        if not user_id:
            print("Unauthorized: No user ID found in headers")
            return create_response(401, {'error': 'Unauthorized'})
        
        print(f"Fetching files for user: {user_id}")
        
        # Add debug logging for environment variables
        print(f"DynamoDB Table Name: {os.environ.get('FILES_TABLE_NAME')}")
        
        # Add error handling for DynamoDB scan
        try:
            response = table.scan(
                FilterExpression='userId = :userId',
                ExpressionAttributeValues={':userId': user_id}
            )
            print(f"DynamoDB response: {json.dumps(response, default=str)}")
            
            if 'Items' not in response:
                print("No 'Items' key in DynamoDB response")
                return create_response(200, [])
                
            files = []
            for item in response.get('Items', []):
                try:
                    file_data = {
                        'fileId': str(item.get('fileId', '')),
                        'fileName': str(item.get('fileName', 'Unknown')),
                        'fileType': str(item.get('fileType', '')),
                        'fileSize': int(item.get('fileSize', 0)) if item.get('fileSize') else 0,
                        'uploadDate': str(item.get('uploadDate', '')),
                        'fileKey': str(item.get('fileKey', ''))
                    }
                    # Ensure all values are JSON serializable
                    files.append(file_data)
                except Exception as e:
                    print(f"Error processing file item: {str(e)}")
                    continue
            
            print(f"Found {len(files)} files for user {user_id}")
            print(f"Sample file data: {json.dumps(files[0] if files else {})}")
            return create_response(200, files)
            
        except Exception as db_error:
            print(f"DynamoDB Error: {str(db_error)}")
            print(f"Error type: {type(db_error).__name__}")
            if hasattr(db_error, 'response'):
                print(f"Error response: {db_error.response}")
            return create_response(500, {
                'error': 'Database error',
                'details': str(db_error),
                'type': type(db_error).__name__
            })
            
    except Exception as e:
        print(f"Unexpected error in list_user_files: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return create_response(500, {
            'error': 'Failed to list files',
            'details': str(e),
            'type': type(e).__name__
        })

def get_file(file_id, headers):
    """Get file metadata and generate a pre-signed URL for download."""
    user_id = get_user_id_from_headers(headers)
    if not user_id:
        return create_response(401, {'error': 'Unauthorized'})
    
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
        
        # Prepare response with only the necessary fields and ensure they're serializable
        file_data = {
            'fileId': item.get('fileId'),
            'fileName': item.get('fileName'),
            'fileType': item.get('fileType'),
            'fileSize': int(item.get('fileSize', 0)) if item.get('fileSize') else 0,
            'uploadDate': item.get('uploadDate'),
            'downloadUrl': url
        }
        
        # Return file metadata with download URL
        return create_response(200, file_data)
        
    except Exception as e:
        print(f"Get file error: {str(e)}")
        return create_response(500, {'error': 'Failed to get file'})

def delete_file(file_id, headers):
    """Delete a file from S3 and its metadata from DynamoDB."""
    user_id = get_user_id_from_headers(headers)
    if not user_id:
        return create_response(401, {'error': 'Unauthorized'})
    
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

def lambda_handler(event, context):
    """Main Lambda handler function."""
    try:
        print("=== LAMBDA INVOCATION START ===")
        print("Event keys:", json.dumps(list(event.keys()), default=str))
        
        # Get HTTP method and route key
        http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
        route_key = event.get('routeKey', '')
        print(f"HTTP Method: {http_method}")
        print(f"Route Key: {route_key}")
        
        # Get headers in lowercase for case-insensitive access
        headers = {k.lower(): v for k, v in event.get('headers', {}).items()}
        print("Headers:", json.dumps(headers, default=str))
        
        # Handle request body
        body = event.get('body', '')
        is_base64_encoded = event.get('isBase64Encoded', False)
        content_type = headers.get('content-type', '').lower()
        
        print(f"Content-Type: {content_type}")
        print(f"isBase64Encoded: {is_base64_encoded}")
        print(f"Body type: {type(body)}")
        print(f"Body length: {len(body) if hasattr(body, '__len__') else 'N/A'}")
        
        # For file uploads, we'll handle the raw body in the upload handler
        if 'multipart/form-data' in content_type:
            print("Processing multipart/form-data request")
            # Pass the raw body and headers to handle_file_upload
            return handle_file_upload(event, headers)
            
        # For JSON requests, parse the body
        parsed_body = {}
        if body:
            try:
                if is_base64_encoded:
                    body = base64.b64decode(body).decode('utf-8')
                if isinstance(body, str):
                    try:
                        parsed_body = json.loads(body)
                    except json.JSONDecodeError:
                        print("Warning: Could not parse body as JSON, treating as raw string")
                        parsed_body = {'raw': body}
                else:
                    parsed_body = body
            except Exception as e:
                print(f"Error parsing request body: {str(e)}")
                return create_response(400, {'error': 'Invalid request body', 'details': str(e)})
        
        print("Parsed body:", json.dumps(parsed_body, default=str))
        
        # Extract the path from route key (e.g., 'GET /files' -> '/files')
        path = route_key.split(' ', 1)[1] if ' ' in route_key else route_key
        print(f"Routing request: {http_method} {path}")
        
        # Handle OPTIONS requests first (CORS preflight)
        if http_method == 'OPTIONS':
            print("Handling OPTIONS preflight request")
            return create_response(200, {})
        
        # Route the request based on HTTP method and path
        if http_method == 'POST' and path == '/auth':
            print("Routing to auth handler")
            return handle_auth(parsed_body)
        elif http_method == 'POST' and path == '/files':
            print("Routing to file upload handler")
            # For file uploads, pass the entire event and headers
            return handle_file_upload(event, headers)
        elif http_method == 'GET' and path == '/files':
            print("Routing to list files handler")
            return list_user_files(headers)
        elif http_method == 'GET' and path.startswith('/files/'):
            file_id = event.get('pathParameters', {}).get('fileId')
            print(f"Fetching file with ID: {file_id}")
            if file_id:
                return get_file(file_id, headers)
        elif http_method == 'DELETE' and path.startswith('/files/'):
            file_id = event.get('pathParameters', {}).get('fileId')
            print(f"Deleting file with ID: {file_id}")
            if file_id:
                return delete_file(file_id, headers)
        
        # Log the unhandled request for debugging
        print(f"Unhandled request - Method: {http_method}, Path: {path}, RouteKey: {route_key}")
        return create_response(404, {'error': 'Not Found', 'details': f'No route for {http_method} {path}'})
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal Server Error', 'details': str(e)})