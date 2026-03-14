import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Heading,
  List,
  Link,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

/**
 * Rich text editor cho nội dung blog (CKEditor 5).
 * Dùng license GPL cho dự án open-source.
 * value/onChange tương thích controlled input.
 */
const EDITOR_CONFIG = {
  licenseKey: "GPL",
  plugins: [
    Essentials,
    Paragraph,
    Bold,
    Italic,
    Heading,
    List,
    Link,
  ],
  toolbar: [
    "undo",
    "redo",
    "|",
    "heading",
    "|",
    "bold",
    "italic",
    "|",
    "numberedList",
    "bulletedList",
    "|",
    "link",
  ],
  heading: {
    options: [
      { model: "paragraph", title: "Đoạn văn", class: "ck-heading_paragraph" },
      { model: "heading2", view: "h2", title: "Tiêu đề 2", class: "ck-heading_heading2" },
      { model: "heading3", view: "h3", title: "Tiêu đề 3", class: "ck-heading_heading3" },
    ],
  },
};

/**
 * Chuyển plain text sang HTML cơ bản để CKEditor hiển thị đúng.
 * Nếu đã là HTML (có thẻ đóng </) thì giữ nguyên.
 */
function toEditorData(value) {
  if (!value || typeof value !== "string") return "<p></p>";
  const s = value.trim();
  if (s.includes("</") && (s.includes("<p>") || s.includes("<h") || s.includes("<div"))) {
    return s;
  }
  if (!s) return "<p></p>";
  return "<p>" + s.replace(/\n/g, "</p><p>") + "</p>";
}

export function BlogRichEditor({ value = "", onChange, disabled, placeholder }) {
  const initialData = toEditorData(value);

  return (
    <div className="blog-rich-editor">
      <CKEditor
        editor={ClassicEditor}
        config={EDITOR_CONFIG}
        data={initialData}
        onReady={(editor) => {
          if (placeholder) {
            editor.editing.view.domRoot.setAttribute("data-placeholder", placeholder);
          }
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange?.({ target: { value: data } });
        }}
        disabled={disabled}
      />
    </div>
  );
}
