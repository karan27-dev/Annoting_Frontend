export type AnnotationType =
  | "bbox"
  | "polygon"
  | "segmentation"
  | "keypoint"
  | "classification";

export type ProjectStatus =
  | "pending_setup"
  | "active"
  | "paused"
  | "review"
  | "delivered"
  | "archived";

export interface LabelClass {
  name: string;
  color: string;
  attributes?: string[];
}

export type MediaType = "images" | "videos" | "mixed";
export type DataSourceKind = "upload" | "gdrive";
export type DeliveryFormat = "coco" | "yolo" | "voc" | "cvat_xml" | "datumaro";

export type IntakeStatus =
  | "awaiting_data"
  | "counting"
  | "counted"
  | "pending_review"
  | "quoted"
  | "quote_accepted";

export interface Project {
  id: string;
  name: string;
  description?: string;
  annotation_type: AnnotationType;
  status: ProjectStatus;
  total_images: number;
  images_completed: number;
  quality_score?: number | null;
  quality_target: number;
  turnaround_days?: number | null;
  created_at: string;
  delivered_at?: string | null;
  media_type: MediaType;
  data_source: DataSourceKind;
  gdrive_link?: string | null;
  image_count: number;
  video_count: number;
  delivery_format: DeliveryFormat;
  estimated_objects_per_image?: number | null;
  complexity_tier?: string | null;
  intake_status: IntakeStatus;
  intake_detail?: string | null;
}

export interface QuoteSummary {
  id: string;
  rate_per_label_inr: number;
  estimated_labels: number;
  quoted_total_inr: number;
  turnaround_premium_pct: number;
  volume_discount_pct: number;
  accepted_at?: string | null;
}

export interface Intake {
  intake_status: IntakeStatus;
  intake_detail?: string | null;
  media_type: MediaType;
  image_count: number;
  video_count: number;
  total_files: number;
  data_source: DataSourceKind;
  gdrive_link?: string | null;
  estimated_objects_per_image?: number | null;
  complexity_tier?: string | null;
  delivery_format: DeliveryFormat;
  quote?: QuoteSummary | null;
}

export const DELIVERY_FORMATS: {
  key: DeliveryFormat;
  label: string;
  hint: string;
}[] = [
  { key: "coco", label: "COCO JSON", hint: "Detectron2, MMDetection" },
  { key: "yolo", label: "YOLO TXT", hint: "Ultralytics, Darknet" },
  { key: "voc", label: "Pascal VOC XML", hint: "Classic per-image XML" },
  { key: "cvat_xml", label: "CVAT XML", hint: "Re-import into CVAT" },
  { key: "datumaro", label: "Datumaro JSON", hint: "Convert to anything later" },
];

export interface Invoice {
  id: string;
  invoice_number: string;
  amount_inr: number;
  gst_amount_inr: number;
  total_inr: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issued_at?: string | null;
  due_at?: string | null;
}

export interface AnnotatorJob {
  cvat_job_id: number;
  cvat_task_id: number;
  project_name: string;
  annotation_type: AnnotationType;
  image_count: number;
  rate_per_label: number;
  estimated_minutes: number;
}
