import os
import json
import copy
from docx import Document
from merger import _replace_runs_text, get_all_paragraphs
from google import genai
from google.genai import types

def ai_merge_documents(template_doc: Document, content_doc: Document) -> Document:
    # Gemini client otomatik olarak ortam değişkenlerinden (GEMINI_API_KEY) key'i alır.
    client = genai.Client()
    
    # Şablondaki ve içerikteki TÜM paragrafları (tablolar dahil) al
    template_all_paras = get_all_paragraphs(template_doc)
    content_all_paras = get_all_paragraphs(content_doc)

    # Şablondaki TÜM paragrafları (boş olanlar dahil) al, AI bağlamı kursun
    template_paras = get_all_paragraphs(template_doc)
    template_texts = [p.text for p in template_paras]
    
    # İçerik dosyasından ham metni al
    content_all_paras = get_all_paragraphs(content_doc)
    content_texts = [p.text.strip() for p in content_all_paras if p.text.strip()]
    full_content = "\n".join(content_texts)
    
    # AI Prompt oluşturma
    prompt_lines = []
    for i, text in enumerate(template_texts):
        prompt_lines.append(f"[{i}]: {repr(text)}")
    template_structure = "\n".join(prompt_lines)

    prompt = f"""
Sen otel veya tesis yönetiminde uzman, bir Housekeeping (HK - Kat Hizmetleri) yöneticisine, çalışanları için standart prosedürler (SOP) hazırlamasında yardım eden profesyonel bir belge düzenleme asistanısın.
Amacın, "YENİ İÇERİK" metninde verilen bilgileri "ŞABLON PARAGRAFLARI" dizisindeki doğru yerlere yerleştirerek eksiksiz bir Kat Hizmetleri prosedürü oluşturmaktır.

ŞABLON PARAGRAFLARI:
(Her satır [İndeks]: "Metin" formatındadır. Sıra belgedeki görünüm sırasıdır.)
{template_structure}

YENİ İÇERİK:
{full_content}

KURALLAR:
1. Sonuç olarak AŞAĞIDAKİ GİBİ BİR JSON OBJESİ döndür. Asla markdown (```json) kullanma, doğrudan saf {{...}} objesi döndür.
2. "changes": Şablonda zaten var olan, taslak olarak yazılmış veya doldurulması gereken (boş olan) satırları güncellediğin liste.
   - ÇOK ÖNEMLİ: Şablondaki "AMAÇ", "KAPSAM", "TANIMLAR", "RAPORLAMALAR", "SÜREÇ" gibi BÜYÜK HARFLİ ANA BAŞLIKLARI veya etiketleri (Örn: "DJ GRUP MERKEZ") ASLA "changes" içine koyup DEĞİŞTİRME! Başlıklar "original_text" olarak bile changes içinde olmamalı (değişmemesi için hiç listeye alma).
3. "appends": Eğer bir başlığın ALTINDA hazırda boş bir satır veya taslak metin YOKSA ve senin o başlığın altına yeni bir paragraf (veya paragraflar) EKLEMEN gerekiyorsa, bunu "appends" içinde yap. (Bu sayede yazılar başlık gibi mavi/kalın olmaz, normal siyah metin olarak başlığın altına eklenir).
4. ÇOK ÖNEMLİ: Kendi ürettiğin, değiştirdiğin veya doldurduğun hiçbir metinde ASLA "DJ Grup Merkez", "DJ Grup", "DJ Gruba bağlı" gibi özel şirket isimleri KULLANMA. Bunun yerine "işletmemiz", "tesisimiz" veya "otelimiz" gibi ifadeler kullan.
5. Eğer YENİ İÇERİK'te bir başlık için hiçbir bilgi yoksa, o konuya uygun, HK standartlarına yakışan 1-2 cümlelik profesyonel bir metni KENDİN OLUŞTUR ve mutlaka ilgili başlığın altına (veya "changes" ile taslak metne) ekle!

ÖRNEK JSON ÇIKTISI:
{{
  "changes": [
    {{
      "index": 23,
      "original_text": "Bu prosedür DJ Gruba bağlı tüm işletmeleri kapsar.",
      "new_text": "Bu prosedür işletmemizin tüm alanlarını kapsar.",
      "reason": "Kapsam metni düzeltildi ve şirket ibaresi kaldırıldı."
    }}
  ],
  "appends": [
    {{
      "parent_index": 20,
      "parent_text": "TANIMLAR",
      "new_paragraphs": [
        "Bu prosedürde geçen 'Arıza' terimi,...",
        "'HK Personeli' ise..."
      ],
      "reason": "Tanımlar başlığının altı boştu, yeni tanımlar oluşturulup eklendi."
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )
    
    # AI Yanıtını parse et
    try:
        response_json = json.loads(response.text)
        if not isinstance(response_json, dict):
            raise ValueError("Response is not a dict")
            
        changes = response_json.get("changes", [])
        appends = response_json.get("appends", [])
        
        # Gelen eşleşmiş metinleri şablona yaz
        # 1. Var olan paragrafları güncelle
        for change in changes:
            idx_val = change.get("index")
            if idx_val is None:
                continue
                
            idx = int(idx_val)
            new_text = str(change.get("new_text", ""))
            if idx < len(template_paras):
                p = template_paras[idx]
                if new_text != p.text:
                    _replace_runs_text(p._element, new_text)
                    
        # 2. Paragrafın hemen altına yeni paragraflar ekle (Normal siyah yazı formatında)
        from docx.oxml import OxmlElement
        from docx.text.paragraph import Paragraph
        
        for append_obj in appends:
            parent_idx_val = append_obj.get("parent_index")
            if parent_idx_val is None:
                continue
                
            parent_idx = int(parent_idx_val)
            new_paragraphs = append_obj.get("new_paragraphs", [])
            
            if parent_idx < len(template_paras):
                p = template_paras[parent_idx]
                current_xml = p._element
                for append_text in new_paragraphs:
                    new_p_xml = OxmlElement("w:p")
                    current_xml.addnext(new_p_xml)
                    new_para = Paragraph(new_p_xml, p._parent)
                    new_para.add_run(str(append_text))
                    current_xml = new_p_xml

    except Exception as e:
        print(f"AI Parse Error: {str(e)}\nResponse: {response.text}")
        raise ValueError(f"Yapay zeka çıktısı işlenemedi: {str(e)}")
            
    return template_doc
