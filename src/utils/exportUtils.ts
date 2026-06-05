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
  
  const formattedData = data.map((item) => {
    const formattedItem: any = {};
    keys.forEach((key) => {
      formattedItem[headerMap[key]] = item[key];
    });
    return formattedItem;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Tự động căn chỉnh độ rộng cột (Auto-fit width)
  const colWidths = keys.map((key) => {
    const headerTitle = headerMap[key] || "";
    // Tìm độ dài lớn nhất trong dữ liệu cột đó, hoặc lấy độ dài tiêu đề
    const maxLength = data.reduce((max, item) => {
      const cellValue = item[key] ? String(item[key]) : "";
      return Math.max(max, cellValue.length);
    }, headerTitle.length);
    
    // Thêm padding cho dễ nhìn (giới hạn tối đa 60 ký tự để không quá to)
    return { wch: Math.min(maxLength + 3, 60) };
  });

  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
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
