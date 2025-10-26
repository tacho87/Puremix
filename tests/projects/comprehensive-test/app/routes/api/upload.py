#!/usr/bin/env python3
"""
Python API endpoint for file upload
Test: POST /api/upload
"""

import json
import os
import time
import hashlib
import mimetypes
from datetime import datetime

def main(context):
    """
    Main handler for file upload API endpoint
    """
    request = context.get('request', {})
    method = request.get('method', 'GET').upper()
    
    print(f"🐍 Python API Request: {method} /api/upload")
    print(f"   Content-Type: {request.get('headers', {}).get('content-type', 'unknown')}")
    print(f"   Content-Length: {request.get('headers', {}).get('content-length', 'unknown')}")
    
    if method != 'POST':
        return {
            'status': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': 'Method not allowed',
                'allowed': ['POST'],
                'received': method
            })
        }
    
    try:
        return handle_file_upload(context)
    except Exception as error:
        print(f"❌ Upload API Error: {str(error)}")
        return {
            'status': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error',
                'message': str(error),
                'timestamp': datetime.now().isoformat()
            })
        }

def handle_file_upload(context):
    """
    Handle file upload with validation and processing
    """
    request = context.get('request', {})
    files = request.get('files', {})
    body = request.get('body', {})
    
    # File upload validation
    if not files:
        return {
            'status': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': 'No files provided',
                'message': 'Request must include file uploads'
            })
        }
    
    uploaded_files = []
    errors = []
    
    for field_name, file_data in files.items():
        try:
            file_result = process_single_file(file_data, field_name, body)
            if file_result['success']:
                uploaded_files.append(file_result['data'])
            else:
                errors.append(file_result['error'])
        except Exception as e:
            errors.append(f"Failed to process file {field_name}: {str(e)}")
    
    # Response based on results
    if not uploaded_files and errors:
        return {
            'status': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': 'All file uploads failed',
                'errors': errors,
                'timestamp': datetime.now().isoformat()
            })
        }
    
    response_data = {
        'success': True,
        'message': f'Successfully uploaded {len(uploaded_files)} file(s)',
        'files': uploaded_files,
        'processing': {
            'total_files': len(files),
            'successful': len(uploaded_files),
            'failed': len(errors),
            'processing_time': f"{time.time() * 1000:.2f}ms"
        },
        'meta': {
            'endpoint': 'POST /api/upload',
            'timestamp': datetime.now().isoformat(),
            'server': 'Python 3.x'
        }
    }
    
    if errors:
        response_data['warnings'] = errors
    
    return {
        'status': 201 if uploaded_files else 400,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(response_data)
    }

def process_single_file(file_data, field_name, metadata):
    """
    Process and validate a single uploaded file
    """
    filename = file_data.get('filename', 'unknown')
    content = file_data.get('content', b'')
    mimetype = file_data.get('mimetype', 'application/octet-stream')
    
    print(f"📁 Processing file: {filename} ({len(content)} bytes)")
    
    # File validation
    validation_result = validate_file(filename, content, mimetype)
    if not validation_result['valid']:
        return {
            'success': False,
            'error': f"File validation failed for {filename}: {validation_result['error']}"
        }
    
    # File analysis
    file_hash = hashlib.md5(content).hexdigest()
    file_size = len(content)
    
    # Simulate file processing
    processed_file = {
        'field_name': field_name,
        'original_name': filename,
        'size': file_size,
        'mimetype': mimetype,
        'hash': file_hash,
        'uploaded_at': datetime.now().isoformat(),
        'status': 'uploaded',
        'url': f"/uploads/{file_hash}_{filename}",  # Simulated URL
        'metadata': {
            'user_agent': metadata.get('user_agent', 'unknown'),
            'ip_address': metadata.get('ip_address', 'unknown'),
            'upload_session': metadata.get('session_id', 'unknown')
        }
    }
    
    # Add file-type specific processing
    if mimetype.startswith('image/'):
        processed_file['image_info'] = analyze_image(content, filename)
    elif mimetype == 'application/pdf':
        processed_file['pdf_info'] = analyze_pdf(content)
    elif mimetype.startswith('text/'):
        processed_file['text_info'] = analyze_text(content.decode('utf-8', errors='ignore'))
    
    return {
        'success': True,
        'data': processed_file
    }

def validate_file(filename, content, mimetype):
    """
    Validate uploaded file for security and constraints
    """
    # File size limits (10MB max)
    max_size = 10 * 1024 * 1024
    if len(content) > max_size:
        return {
            'valid': False,
            'error': f'File too large: {len(content)} bytes (max: {max_size} bytes)'
        }
    
    # Empty file check
    if len(content) == 0:
        return {
            'valid': False,
            'error': 'Empty file not allowed'
        }
    
    # Filename validation
    if not filename or filename.startswith('.') or '/' in filename or '\\' in filename:
        return {
            'valid': False,
            'error': 'Invalid filename'
        }
    
    # Dangerous file extensions
    dangerous_extensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.jar']
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext in dangerous_extensions:
        return {
            'valid': False,
            'error': f'File type not allowed: {file_ext}'
        }
    
    # MIME type validation
    expected_mimetype, _ = mimetypes.guess_type(filename)
    if expected_mimetype and expected_mimetype != mimetype:
        print(f"⚠️ MIME type mismatch: expected {expected_mimetype}, got {mimetype}")
    
    return {'valid': True}

def analyze_image(content, filename):
    """
    Basic image analysis (simulation)
    """
    try:
        # In real implementation, would use PIL/Pillow
        return {
            'type': 'image',
            'estimated_dimensions': '800x600',  # Simulated
            'color_depth': '24-bit',
            'compression': 'standard',
            'analysis_method': 'simulated'
        }
    except Exception as e:
        return {
            'type': 'image',
            'error': f'Could not analyze image: {str(e)}'
        }

def analyze_pdf(content):
    """
    Basic PDF analysis (simulation)
    """
    try:
        # In real implementation, would use PyPDF2 or similar
        return {
            'type': 'pdf',
            'estimated_pages': 5,  # Simulated
            'version': '1.4',
            'has_text': True,
            'has_images': True,
            'analysis_method': 'simulated'
        }
    except Exception as e:
        return {
            'type': 'pdf',
            'error': f'Could not analyze PDF: {str(e)}'
        }

def analyze_text(text_content):
    """
    Basic text analysis
    """
    try:
        lines = text_content.split('\n')
        words = text_content.split()
        
        return {
            'type': 'text',
            'character_count': len(text_content),
            'word_count': len(words),
            'line_count': len(lines),
            'encoding': 'utf-8',
            'has_special_chars': not text_content.isascii(),
            'analysis_method': 'python_native'
        }
    except Exception as e:
        return {
            'type': 'text',
            'error': f'Could not analyze text: {str(e)}'
        }