import React from "react";
import { Steps, Button, Table, Upload, notification, Empty, Tag } from "antd";
import {
  FileSpreadsheet,
  Upload as UploadIcon,
  Download,
  CheckCircle,
  Eye,
  Database,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import type { ColumnType } from "antd/es/table";
import { bulkCreateResidentContacts } from "../../residentContacts/apis";

type PreviewRow = {
  _rowIndex: number;
  _errors?: string[];
  email: string;
  phoneNumber: string;
  cccd: string;
  address: string;
};

const STEP_LABELS = ["Chọn file", "Xem trước dữ liệu", "Nạp dữ liệu"];

const TEMPLATE_HEADERS = [
  "Email (Địa chỉ thư điện tử)",
  "Số điện thoại",
  "Số CCCD",
  "Địa chỉ liên hệ",
];

const SAMPLE_ROWS = [
  [
    "nguyenvana@gmail.com",
    "0901234567",
    "079201012345",
    "123 Đường ABC, Phường 1, Quận 1",
  ],
  [
    "tranthib@gmail.com",
    "0912345678",
    "079201067890",
    "456 Đường XYZ, Phường 2, Quận 3",
  ],
];

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...SAMPLE_ROWS]);
  ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HoDan");
  XLSX.writeFile(wb, "Mau_Nhap_HoDan.xlsx");
};

const parseExcel = (file: File): Promise<PreviewRow[]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const dataRows = rows.slice(1).filter((r) => r.some(Boolean));
        const parsed: PreviewRow[] = dataRows.map((r, i) => {
          const errors: string[] = [];
          if (!r[2]) errors.push("Thiếu số CCCD");
          return {
            _rowIndex: i + 2,
            _errors: errors,
            email: String(r[0] ?? ""),
            phoneNumber: String(r[1] ?? ""),
            cccd: String(r[2] ?? ""),
            address: String(r[3] ?? ""),
          };
        });
        resolve(parsed);
      } catch {
        reject(new Error("Không thể đọc file Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsBinaryString(file);
  });

export default function ImportResidentsPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const rows = await parseExcel(file);
      if (rows.length === 0) {
        notification.warning({
          title: "Cảnh báo",
          description: "File không có dữ liệu",
        });
        return false;
      }
      setPreviewData(rows);
      setPage(1);
      setCurrentStep(1);
    } catch (err: any) {
      notification.error({
        title: "Lỗi",
        description: err.message || "Lỗi đọc file",
      });
    }
    return false; // Prevent auto-upload by Ant Design
  };

  const handleImport = async () => {
    const valid = previewData.filter((r) => !r._errors?.length);
    if (valid.length === 0) {
      notification.warning({
        message: "Cảnh báo",
        description: "Không có dòng hợp lệ để nhập",
      });
      return;
    }
    setIsImporting(true);
    setCurrentStep(2);
    try {
      const contacts = valid.map(({ _rowIndex, _errors, ...rest }) => rest);
      const result = await bulkCreateResidentContacts(contacts);
      const success = result.data?.success ?? valid.length;
      const failed = result.data?.errors?.length ?? 0;
      setImportResult({ success, failed });
      if (failed === 0) {
        notification.success({
          message: "Thành công",
          description: `Nhập ${success} thông tin liên hệ thành công`,
        });
      } else {
        notification.warning({
          message: "Cảnh báo",
          description: `Nhập xong: ${success} thành công, ${failed} thất bại`,
        });
      }
    } catch {
      setImportResult({ success: 0, failed: valid.length });
      notification.error({
        message: "Thất bại",
        description: "Nhập dữ liệu thất bại, vui lòng thử lại",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const columns: ColumnType<PreviewRow>[] = [
    {
      title: "Dòng",
      dataIndex: "_rowIndex",
      key: "_rowIndex",
      width: 60,
      render: (v) => (
        <span className="text-slate-400 text-xs font-mono">{v}</span>
      ),
    },
    {
      title: "Trạng thái",
      key: "_status",
      width: 110,
      render: (_, record) =>
        record._errors?.length ? (
          <Tag color="red" className="text-xs">
            Lỗi
          </Tag>
        ) : (
          <Tag color="green" className="text-xs">
            Hợp lệ
          </Tag>
        ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 130,
    },
    {
      title: "Số CCCD",
      dataIndex: "cccd",
      key: "cccd",
      width: 150,
      render: (v: string) => (
        <span className="font-mono text-sm">{v || "—"}</span>
      ),
    },
    {
      title: "Địa chỉ liên hệ",
      dataIndex: "address",
      key: "address",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Lỗi",
      key: "_errors",
      width: 180,
      render: (_, record) =>
        record._errors?.length ? (
          <span className="text-red-500 text-xs">
            {record._errors.join(", ")}
          </span>
        ) : null,
    },
  ];

  const errorCount = previewData.filter((r) => r._errors?.length).length;
  const validCount = previewData.length - errorCount;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/80 p-6 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={22} className="text-green-600" />
              Nhập dữ liệu hộ dân từ Excel
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Tải file Excel mẫu, điền dữ liệu rồi upload để nhập hàng loạt
            </p>
          </div>
          <Button
            onClick={() => navigate("/app/residents-manager/list")}
            className="text-slate-500"
          >
            Quay lại
          </Button>
        </div>

        {/* Stepper */}
        <Steps
          current={currentStep}
          className="mb-8"
          items={[
            {
              title: STEP_LABELS[0],
              icon: <UploadIcon size={16} />,
            },
            {
              title: STEP_LABELS[1],
              icon: <Eye size={16} />,
            },
            {
              title: STEP_LABELS[2],
              icon: <Database size={16} />,
            },
          ]}
        />

        {/* Step 0: Choose File */}
        {currentStep === 0 && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-full max-w-xl border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-4 bg-slate-50">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <FileSpreadsheet size={32} className="text-green-500" />
              </div>
              <p className="text-slate-500 text-sm text-center">
                Chọn file Excel (.xlsx, .xls) để tải lên và xem trước dữ liệu
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <Button
                  icon={<Download size={15} />}
                  onClick={downloadTemplate}
                  className="border-blue-500 text-blue-500 hover:bg-blue-50"
                >
                  Tải file mẫu
                </Button>
                <Upload
                  accept=".xlsx,.xls"
                  beforeUpload={handleFile}
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button
                    type="primary"
                    icon={<UploadIcon size={15} />}
                    className="bg-green-600 border-green-600 hover:bg-green-500"
                  >
                    Chọn file Excel
                  </Button>
                </Upload>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Preview */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  File:{" "}
                  <strong className="text-slate-700 font-mono">
                    {fileName}
                  </strong>
                </span>
                <Tag color="green">{validCount} hợp lệ</Tag>
                {errorCount > 0 && <Tag color="red">{errorCount} lỗi</Tag>}
              </div>
              <div className="flex items-center gap-2">
                <Upload
                  accept=".xlsx,.xls"
                  beforeUpload={handleFile}
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button icon={<UploadIcon size={15} />}>Đổi file</Button>
                </Upload>
                <Button
                  type="primary"
                  icon={<Database size={15} />}
                  disabled={validCount === 0}
                  onClick={handleImport}
                  className="bg-green-600 border-green-600 hover:bg-green-500"
                >
                  Nạp dữ liệu ({validCount})
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100">
              <Table
                dataSource={previewData}
                columns={columns}
                rowKey="_rowIndex"
                scroll={{ x: 1100 }}
                size="small"
                rowClassName={(record) =>
                  record._errors?.length
                    ? "bg-red-50 hover:bg-red-100"
                    : "hover:bg-slate-50"
                }
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Không có dữ liệu"
                    />
                  ),
                }}
                pagination={{
                  current: page,
                  pageSize: limit,
                  total: previewData.length,
                  onChange: setPage,
                  showSizeChanger: false,
                  showTotal: (t) => (
                    <span className="text-slate-400 text-sm">
                      Tổng <b>{t}</b> dòng
                    </span>
                  ),
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Importing / Done */}
        {currentStep === 2 && (
          <div className="flex flex-col items-center gap-6 py-12">
            {isImporting ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                  <Database size={32} className="text-blue-500" />
                </div>
                <p className="text-slate-600 text-base font-medium">
                  Đang nạp dữ liệu...
                </p>
              </>
            ) : importResult ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="text-slate-800 text-lg font-semibold">
                  Nạp dữ liệu hoàn tất
                </p>
                <div className="flex items-center gap-4">
                  <Tag color="green" className="text-base px-3 py-1">
                    ✓ {importResult.success} thành công
                  </Tag>
                  {importResult.failed > 0 && (
                    <Tag color="red" className="text-base px-3 py-1">
                      ✗ {importResult.failed} thất bại
                    </Tag>
                  )}
                </div>
                <div className="flex gap-3 mt-2">
                  <Button
                    onClick={() => {
                      setCurrentStep(0);
                      setPreviewData([]);
                      setFileName("");
                      setImportResult(null);
                    }}
                  >
                    Nhập file mới
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => navigate("/app/residents-manager/list")}
                  >
                    Về danh sách hộ dân
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
