"""
Word Document Merger - Core Engine (Rule-Based)

Merges the formatting of a template .docx with the text content of a content .docx.
Strategy:
- Modifies the template document IN-PLACE to preserve 100% of its original
  styles, numbering, tables, headers, footers, and relationships.
- Maps non-empty paragraphs from the content document to non-empty paragraphs
  in the template document.
- Empty paragraphs in the template are preserved as spacing.
"""

from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.text.paragraph import Paragraph
from docx.table import Table
import copy

def get_all_paragraphs(parent):
    """Recursively yield all paragraphs from a Document or _Cell."""
    paras = []
    
    if hasattr(parent, 'element') and hasattr(parent.element, 'body'):
        parent_elm = parent.element.body
    elif hasattr(parent, '_tc'):
        parent_elm = parent._tc
    elif hasattr(parent, '_element'):
        parent_elm = parent._element
    else:
        return paras

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            paras.append(Paragraph(child, parent))
        elif isinstance(child, CT_Tbl):
            table = Table(child, parent)
            for row in table.rows:
                for cell in row.cells:
                    paras.extend(get_all_paragraphs(cell))
    return paras

def merge_documents(template_doc: Document, content_doc: Document) -> Document:
    # 1. Extract non-empty texts from content document
    content_all_paras = get_all_paragraphs(content_doc)
    content_texts = [p.text for p in content_all_paras if p.text.strip()]
    
    # 2. Find all root-level and table non-empty paragraphs in the template
    template_all_paras = get_all_paragraphs(template_doc)
    template_paras = [p for p in template_all_paras if p.text.strip()]
    
    # 3. Replace text in template paragraphs
    for i, p in enumerate(template_paras):
        if i < len(content_texts):
            _replace_runs_text(p._element, content_texts[i])
            
    # 4. If content has more paragraphs than template, duplicate the last one
    if len(content_texts) > len(template_paras):
        if template_paras:
            last_p_el = template_paras[-1]._element
            parent = last_p_el.getparent()
            
            body = template_doc.element.body
            sectPr = body.find(qn('w:sectPr'))
            
            for text in content_texts[len(template_paras):]:
                new_p = copy.deepcopy(last_p_el)
                _replace_runs_text(new_p, text)
                if sectPr is not None:
                    sectPr.addprevious(new_p)
                else:
                    body.append(new_p)
        else:
            # If template had literally no text paragraphs, just add them
            for text in content_texts:
                template_doc.add_paragraph(text)
                
    return template_doc

def _add_text_with_breaks(run_el, text: str):
    lines = str(text).split('\n')
    for i, line in enumerate(lines):
        if line:
            t_el = OxmlElement('w:t')
            t_el.text = line
            t_el.set(qn('xml:space'), 'preserve')
            run_el.append(t_el)
        if i < len(lines) - 1:
            run_el.append(OxmlElement('w:br'))

def _replace_runs_text(para_element, new_text: str):
    """
    Replace text across all <w:r> (run) elements in a paragraph XML element.
    If new_text contains \\n, it inserts <w:br> tags.
    """
    runs = para_element.findall(qn('w:r'))
    if not runs:
        # No runs exist – create one
        run_el = OxmlElement('w:r')
        # Copy paragraph's rPr if available
        pPr = para_element.find(qn('w:pPr'))
        if pPr is not None:
            rPr_in_pPr = pPr.find(qn('w:rPr'))
            if rPr_in_pPr is not None:
                run_el.append(copy.deepcopy(rPr_in_pPr))
        _add_text_with_breaks(run_el, new_text)
        para_element.append(run_el)
        return

    first_run = True
    for run in runs:
        # Clear existing text and breaks
        for child in list(run):
            if child.tag == qn('w:t') or child.tag == qn('w:br'):
                run.remove(child)

        if first_run:
            _add_text_with_breaks(run, new_text)
            first_run = False
