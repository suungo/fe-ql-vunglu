const w=(d,m,s)=>{const l=Object.keys(s),p=`
    border: 1px solid #cbd5e1;
    padding: 10px 14px;
    background-color: #144c65;
    color: #ffffff;
    font-size: 11pt;
    font-weight: bold;
    text-align: left;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `.replace(/\s+/g," "),a=e=>`
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    background-color: ${e};
    font-size: 10pt;
    color: #334155;
    vertical-align: middle;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `.replace(/\s+/g," "),r=l.map(e=>`<th style="${p}">${s[e]}</th>`).join(""),f=d.map((e,o)=>{const n=o%2===0?"#ffffff":"#f8fafc";return`<tr>${l.map(c=>{const y=e[c]??"";return`<td style="${a(n)}">${y}</td>`}).join("")}</tr>`}).join(""),b=`
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
        <thead><tr>${r}</tr></thead>
        <tbody>${f}</tbody>
      </table>
    </body>
    </html>`,h=new Blob(["\uFEFF",b],{type:"application/vnd.ms-excel;charset=utf-8"}),i=URL.createObjectURL(h),t=document.createElement("a");t.href=i,t.download=`${m}.xls`,document.body.appendChild(t),t.click(),document.body.removeChild(t),setTimeout(()=>URL.revokeObjectURL(i),1e3)},u=(d,m,s,l,p,a=500)=>{const r=Object.keys(s),f=r.map(o=>{const n=p?.[o];return`<th style="border:1px solid #aaa;padding:3px;background:#dce6f1;font-size:8pt;${n?`width:${n}px;`:""}white-space:nowrap;">${s[o]}</th>`}).join(""),b=d.map(o=>`<tr>${r.map(x=>{const c=String(o[x]??"");return`<td style="border:1px solid #aaa;padding:3px;font-size:8pt;word-wrap:break-word;">${c.length>a?c.slice(0,a)+"...":c}</td>`}).join("")}</tr>`).join(""),h=`
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${l}</title>
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
        <h2 style="text-align:center;color:#144c65;font-size:16pt;margin-bottom:12pt;">${l}</h2>
        <table>
          <thead><tr>${f}</tr></thead>
          <tbody>${b}</tbody>
        </table>
      </div>
    </body>
    </html>`,i=new Blob(["\uFEFF",h],{type:"application/msword"}),t=URL.createObjectURL(i),e=document.createElement("a");e.href=t,e.download=`${m}.doc`,document.body.appendChild(e),e.click(),document.body.removeChild(e),setTimeout(()=>URL.revokeObjectURL(t),1e3)};export{u as a,w as e};
