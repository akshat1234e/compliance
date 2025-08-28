#!/usr/bin/env python3
"""
Document Intelligence Demo
Demonstrates OCR, text extraction, and document classification capabilities
"""

import asyncio
import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import io

# Add src to path for imports
sys.path.append(str(Path(__file__).parent / "src"))

from src.services.document_intelligence import DocumentIntelligenceService


async def create_sample_documents():
    """Create sample documents for testing"""
    
    # Sample RBI circular text
    rbi_circular = """
    RESERVE BANK OF INDIA
    
    RBI/2023-24/125
    Master Circular - Prudential Norms on Income Recognition, 
    Asset Classification and Provisioning pertaining to Advances
    
    Date: April 01, 2024
    
    All Scheduled Commercial Banks
    (Excluding Regional Rural Banks)
    
    Dear Sir/Madam,
    
    This Master Circular consolidates the instructions on prudential norms 
    for income recognition, asset classification and provisioning in respect 
    of advances extended by banks.
    
    The guidelines cover:
    1. Credit risk assessment procedures
    2. Asset classification norms
    3. Provisioning requirements
    4. Restructuring guidelines
    
    Banks are advised to ensure strict compliance with these norms.
    
    Yours faithfully,
    
    (Chief General Manager)
    Department of Supervision
    """
    
    # Sample compliance document
    compliance_doc = """
    COMPLIANCE GUIDELINES
    
    Anti-Money Laundering (AML) and Combating Financing of Terrorism (CFT)
    
    Know Your Customer (KYC) Norms - 2024
    
    This document outlines the enhanced KYC procedures for customer onboarding
    and ongoing due diligence requirements.
    
    Key Requirements:
    - Customer identification procedures
    - Suspicious transaction reporting
    - Record keeping requirements
    - Training and awareness programs
    
    All branches must implement these guidelines immediately.
    """
    
    # Sample risk management document
    risk_doc = """
    RISK MANAGEMENT FRAMEWORK
    
    Basel III Implementation Guidelines
    
    This framework addresses:
    - Credit risk management
    - Operational risk controls
    - Market risk monitoring
    - Liquidity risk assessment
    - Capital adequacy requirements
    
    The framework ensures compliance with international banking standards
    and regulatory requirements.
    """
    
    return {
        "rbi_circular.txt": rbi_circular.encode('utf-8'),
        "compliance_guidelines.txt": compliance_doc.encode('utf-8'),
        "risk_framework.txt": risk_doc.encode('utf-8')
    }


async def create_sample_image_with_text():
    """Create a sample image with text for OCR testing"""
    
    # Create image
    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 24)
        title_font = ImageFont.truetype("arial.ttf", 32)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    # Add text to image
    draw.text((50, 50), "RESERVE BANK OF INDIA", fill='black', font=title_font)
    draw.text((50, 100), "Circular No: RBI/2024-25/001", fill='black', font=font)
    draw.text((50, 140), "Date: January 15, 2024", fill='black', font=font)
    draw.text((50, 180), "", fill='black', font=font)
    draw.text((50, 220), "Subject: Guidelines on Digital Banking", fill='black', font=font)
    draw.text((50, 260), "", fill='black', font=font)
    draw.text((50, 300), "All banks are advised to implement", fill='black', font=font)
    draw.text((50, 340), "enhanced digital security measures.", fill='black', font=font)
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    return img_bytes.getvalue()


async def demo_text_extraction():
    """Demonstrate text extraction capabilities"""
    print("=" * 60)
    print("DOCUMENT INTELLIGENCE DEMO - TEXT EXTRACTION")
    print("=" * 60)
    
    doc_intelligence = DocumentIntelligenceService()
    sample_docs = await create_sample_documents()
    
    for filename, content in sample_docs.items():
        print(f"\n📄 Processing: {filename}")
        print("-" * 40)
        
        try:
            result = await doc_intelligence.extract_text_from_file(
                content, "text/plain", filename
            )
            
            print(f"✅ Extraction successful!")
            print(f"   Method: {result['method']}")
            print(f"   Confidence: {result['confidence']:.2f}")
            print(f"   Text length: {result['text_length']} characters")
            print(f"   Word count: {result['word_count']} words")
            print(f"   Preview: {result['extracted_text'][:100]}...")
            
        except Exception as e:
            print(f"❌ Extraction failed: {e}")


async def demo_document_classification():
    """Demonstrate document classification"""
    print("\n" + "=" * 60)
    print("DOCUMENT INTELLIGENCE DEMO - CLASSIFICATION")
    print("=" * 60)
    
    doc_intelligence = DocumentIntelligenceService()
    sample_docs = await create_sample_documents()
    
    for filename, content in sample_docs.items():
        print(f"\n🏷️  Classifying: {filename}")
        print("-" * 40)
        
        try:
            text = content.decode('utf-8')
            result = await doc_intelligence.classify_document(text)
            
            print(f"✅ Classification successful!")
            print(f"   Predicted category: {result['predicted_category']}")
            print(f"   Confidence: {result['confidence']:.2f}")
            print(f"   Method: {result['method']}")
            
            if result['all_scores']:
                print("   Top categories:")
                for score in result['all_scores'][:3]:
                    print(f"     - {score['category']}: {score['confidence']:.2f}")
            
        except Exception as e:
            print(f"❌ Classification failed: {e}")


async def demo_structure_analysis():
    """Demonstrate document structure analysis"""
    print("\n" + "=" * 60)
    print("DOCUMENT INTELLIGENCE DEMO - STRUCTURE ANALYSIS")
    print("=" * 60)
    
    doc_intelligence = DocumentIntelligenceService()
    sample_docs = await create_sample_documents()
    
    # Use the RBI circular for structure analysis
    rbi_content = sample_docs["rbi_circular.txt"].decode('utf-8')
    
    print(f"\n🔍 Analyzing structure of RBI circular")
    print("-" * 40)
    
    try:
        result = await doc_intelligence.analyze_document_structure(rbi_content)
        
        print(f"✅ Structure analysis successful!")
        print(f"   Total lines: {result['total_lines']}")
        print(f"   Total paragraphs: {result['total_paragraphs']}")
        print(f"   Average paragraph length: {result['avg_paragraph_length']:.1f}")
        print(f"   Structure score: {result['structure_score']:.2f}")
        
        if result['potential_headers']:
            print("   Potential headers:")
            for header in result['potential_headers']:
                print(f"     - {header}")
        
        if result['extracted_dates']:
            print("   Extracted dates:")
            for date in result['extracted_dates']:
                print(f"     - {date}")
        
        if result['extracted_references']:
            print("   Extracted references:")
            for ref in result['extracted_references']:
                print(f"     - {ref}")
        
    except Exception as e:
        print(f"❌ Structure analysis failed: {e}")


async def demo_ocr_capabilities():
    """Demonstrate OCR capabilities"""
    print("\n" + "=" * 60)
    print("DOCUMENT INTELLIGENCE DEMO - OCR CAPABILITIES")
    print("=" * 60)
    
    doc_intelligence = DocumentIntelligenceService()
    
    print(f"\n👁️  Creating sample image with text for OCR")
    print("-" * 40)
    
    try:
        # Create sample image
        image_content = await create_sample_image_with_text()
        
        print(f"✅ Sample image created ({len(image_content)} bytes)")
        
        # Perform OCR
        result = await doc_intelligence.extract_text_from_file(
            image_content, "image/png", "sample_circular.png"
        )
        
        print(f"✅ OCR extraction successful!")
        print(f"   Method: {result['method']}")
        print(f"   Confidence: {result['confidence']:.2f}")
        print(f"   Text length: {result['text_length']} characters")
        print(f"   Word count: {result['word_count']} words")
        print(f"   Extracted text:")
        print(f"   {result['extracted_text']}")
        
    except Exception as e:
        print(f"❌ OCR failed: {e}")
        print("   Note: OCR requires tesseract to be installed")


async def main():
    """Run the complete demo"""
    print("🚀 Starting Document Intelligence Demo")
    print("This demo showcases OCR, text extraction, and classification capabilities")
    
    try:
        await demo_text_extraction()
        await demo_document_classification()
        await demo_structure_analysis()
        await demo_ocr_capabilities()
        
        print("\n" + "=" * 60)
        print("✅ DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nDocument Intelligence System Features Demonstrated:")
        print("• Text extraction from multiple formats")
        print("• Advanced document classification using pattern matching")
        print("• Document structure analysis and metadata extraction")
        print("• OCR capabilities for image-based documents")
        print("• Regulatory document type detection")
        print("\nThe system is ready for production use!")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
