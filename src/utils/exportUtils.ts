import * as XLSX from "xlsx";

/**
 * Hàm hỗ trợ xuất file Excel
 * @param data Mảng dữ liệu cần xuất
 * @param fileName Tên file xuất ra (không cần đuôi .xlsx)
 * @param headerMap Object map giữa key trong data và tên cột hiển thị. VD: { fullName: "Họ và tên" }
 */
export const exportToExcel = (
  data: any[],
  fileName: string,
  headerMap: Record<string, string>
) => {
  const keys = Object.keys(headerMap);

  const thStyle = `
    border: 1px solid #cbd5e1;
    padding: 10px 14px;
    background-color: #144c65;
    color: #ffffff;
    font-size: 11pt;
    font-weight: bold;
    text-align: left;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `.replace(/\s+/g, " ");

  const tdStyle = (bgColor: string) => `
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    background-color: ${bgColor};
    font-size: 10pt;
    color: #334155;
    vertical-align: middle;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `.replace(/\s+/g, " ");

  const theadCells = keys
    .map((key) => `<th style="${thStyle}">${headerMap[key]}</th>`)
    .join("");

  const tbodyRows = data
    .map((item, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = keys
        .map((key) => {
          const val = item[key] ?? "";
          return `<td style="${tdStyle(bgColor)}">${val}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Danh sach</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        table { border-collapse: collapse; }
      </style>
    </head>
    <body>
      <table>
        <thead><tr>${theadCells}</tr></thead>
        <tbody>${tbodyRows}</tbody>
      </table>
    </body>
    </html>`;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Hàm hỗ trợ xuất file Word
 * @param data Mảng dữ liệu cần xuất
 * @param fileName Tên file xuất ra (không cần đuôi .doc)
 * @param headerMap Object map giữa key trong data và tên cột hiển thị
 * @param title Tiêu đề của bảng trong file Word
 */
/**
 * Cấu hình độ rộng từng cột khi xuất Word (đơn vị: px).
 * Nếu không khai báo, mặc định là 80px.
 */
export const exportToWord = (
  data: any[],
  fileName: string,
  headerMap: Record<string, string>,
  title: string,
  colWidths?: Record<string, number>, // key -> width px
  maxCellLength = 500 // mặc định cho phép text dài để rớt dòng thay vì bị cắt
) => {
  const keys = Object.keys(headerMap);

  // Tạo hàng header
  const theadCells = keys
    .map((key) => {
      const w = colWidths?.[key];
      const widthStyle = w ? `width:${w}px;` : "";
      return `<th style="border:1px solid #aaa;padding:3px;background:#dce6f1;font-size:8pt;${widthStyle}white-space:nowrap;">${headerMap[key]}</th>`;
    })
    .join("");

  // Tạo các hàng dữ liệu
  const tbodyRows = data
    .map((item) => {
      const cells = keys
        .map((key) => {
          const raw = String(item[key] ?? "");
          const text =
            raw.length > maxCellLength
              ? raw.slice(0, maxCellLength) + "..."
              : raw;
          return `<td style="border:1px solid #aaa;padding:3px;font-size:8pt;word-wrap:break-word;">${text}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 841.9pt 595.3pt; /* A4 landscape */
          mso-page-orientation: landscape;
          margin: 0.5in 0.5in 0.5in 0.5in;
        }
        div.Section1 { page: Section1; }
        body { font-family: 'Times New Roman', Times, serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { word-wrap: break-word; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2 style="text-align:center;color:#144c65;font-size:16pt;margin-bottom:12pt;">${title}</h2>
        <table>
          <thead><tr>${theadCells}</tr></thead>
          <tbody>${tbodyRows}</tbody>
        </table>
      </div>
    </body>
    </html>`;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
