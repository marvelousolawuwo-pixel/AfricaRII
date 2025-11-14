from flask import Flask, request, jsonify, send_file, send_from_directory, abort, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.colors import HexColor
import os
import json
from datetime import datetime

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
GENERATED_PDFS = 'generated_pdfs'
STATIC_HTML = 'templates'  # move all .html files into /templates
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 
                      'xls', 'xlsx', 'ppt', 'pptx', 'mp4', 'avi', 'mov', 'zip', 'rar'}

MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_PDFS, exist_ok=True)

# Allowed HTML pages
ALLOWED_HTML_PAGES = {
    'index.html',
    'who-we-are.html',
    'tact.html',
    'ajumobi.html',
    'summer-school.html',
    'sisters-club.html',
    'chap.html',
    'youth-empowerment.html',
    'community-resource-centre.html',
    'contact.html'
}

# ------------- Utility -------------
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ------------- ROUTES -------------

@app.route('/')
def index():
    return render_template('index.html')


# Serve static files (CSS, JS, Images)
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('static/css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/images', filename)


# Serve HTML pages (only whitelisted)
@app.route('/<page>')
def serve_page(page):
    if page in ALLOWED_HTML_PAGES:
        return render_template(page)
    abort(404)


# ------------- API: File Upload -------------
@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        files = request.files.getlist('file')
        uploaded_files = []

        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_filename = f"{timestamp}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                uploaded_files.append({
                    'filename': unique_filename,
                    'original_name': filename,
                    'size': os.path.getsize(filepath)
                })

        return jsonify({
            'success': True,
            'files': uploaded_files,
            'message': f'{len(uploaded_files)} file(s) uploaded successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ------------- API: Contact Form -------------
@app.route('/api/contact', methods=['POST'])
def contact_form():
    try:
        data = request.get_json(force=True)
        contacts_file = os.path.join(UPLOAD_FOLDER, 'contacts.json')

        contacts = []
        if os.path.exists(contacts_file):
            with open(contacts_file, 'r') as f:
                contacts = json.load(f)

        data['timestamp'] = datetime.now().isoformat()
        contacts.append(data)

        with open(contacts_file, 'w') as f:
            json.dump(contacts, f, indent=2)

        return jsonify({'success': True, 'message': 'Message received successfully!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ------------- API: Donation Form -------------
@app.route('/api/donate', methods=['POST'])
def donate_form():
    try:
        data = request.get_json(force=True)
        donations_file = os.path.join(UPLOAD_FOLDER, 'donations.json')

        donations = []
        if os.path.exists(donations_file):
            with open(donations_file, 'r') as f:
                donations = json.load(f)

        data['timestamp'] = datetime.now().isoformat()
        donations.append(data)

        with open(donations_file, 'w') as f:
            json.dump(donations, f, indent=2)

        return jsonify({'success': True, 'message': 'Thank you for your support!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ------------- API: Generate PDF -------------
@app.route('/api/generate-pdf/<program>', methods=['GET'])
def generate_pdf(program):
    try:
        pdf_filename = f"Africa-RII_{program}_{datetime.now().strftime('%Y%m%d')}.pdf"
        pdf_path = os.path.join(GENERATED_PDFS, pdf_filename)

        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#1E40AF'),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#1E40AF'),
            spaceAfter=12
        )

        program_titles = {
            'tact': 'Project TACT (Train a Child Today)',
            'ajumobi': 'Àjùmòbí Scholarship Program',
            'summer-school': 'Annual Free Summer School',
            'sisters-club': 'Sisters Club - Gender Advocacy & Mentorship',
            'chap': 'Community Health Awareness Program',
            'youth-empowerment': 'Youth and Women Empowerment Programme',
            'crc': 'Community Resource Centre, Ilora'
        }

        story.append(Paragraph("Africa Rural Interventions Initiative", title_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph(program_titles.get(program, program.title()), heading_style))
        story.append(Spacer(1, 12))
        story.append(Paragraph(
            "This document provides detailed information about our program, impact, and opportunities for involvement.",
            styles['BodyText']
        ))
        story.append(Spacer(1, 20))
        story.append(Paragraph("Our Mission", heading_style))
        story.append(Paragraph(
            "To restore dignity and create opportunities for Africa's most vulnerable communities through education, "
            "skills acquisition, healthcare awareness, and empowerment programs.",
            styles['BodyText']
        ))
        story.append(Spacer(1, 20))
        story.append(Paragraph("Get Involved", heading_style))
        story.append(Paragraph(
            "Partner with us, donate, or volunteer to help us build a brighter future for youths in rural communities.",
            styles['BodyText']
        ))
        story.append(Spacer(1, 10))
        story.append(Paragraph("Contact: info@africarii.org", styles['BodyText']))
        story.append(Paragraph("Website: www.africarii.org", styles['BodyText']))

        doc.build(story)

        return send_file(pdf_path, as_attachment=True, download_name=pdf_filename)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ------------- Run the app -------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
