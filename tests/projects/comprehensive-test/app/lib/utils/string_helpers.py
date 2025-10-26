"""
String utility functions for the comprehensive test app
"""

def format_text(text, options, js_context=None):
    """Format text according to specified options"""
    if not text:
        return {'formatted': '', 'options_applied': 0}

    formatted = text
    applied_count = 0

    if options.get('uppercase'):
        formatted = formatted.upper()
        applied_count += 1

    if options.get('trim'):
        formatted = formatted.strip()
        applied_count += 1

    return {
        'formatted': formatted,
        'original_length': len(text),
        'formatted_length': len(formatted),
        'options_applied': applied_count
    }

def validate_email(email, js_context=None):
    """Validate email address format"""
    is_valid = '@' in email and '.' in email.split('@')[1] if email else False

    return {
        'valid': is_valid,
        'email': email,
        'domain': email.split('@')[1] if is_valid else None
    }

def generate_slug(text, js_context=None):
    """Generate URL-friendly slug from text"""
    if not text:
        return {'slug': '', 'original': text}

    slug = text.lower().replace(' ', '-').replace('_', '-')
    # Remove special characters (simplified)
    import re
    slug = re.sub(r'[^a-z0-9\-]', '', slug)

    return {
        'slug': slug,
        'original': text,
        'length': len(slug)
    }