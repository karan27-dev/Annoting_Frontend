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
  mode: ProjectMode;
}

export type ProjectMode = "managed" | "self_serve";

export interface Box {
  label: string;
  x: number; // 0..1 fractions of width/height
  y: number;
  w: number;
  h: number;
}

export interface DatasetImageItem {
  id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  status: "unlabeled" | "labeled" | "review" | "approved";
  box_count: number;
  split: string;
}

export interface ImageDetail {
  id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  status: string;
  split: string;
  annotations: Box[];
  labels: { name: string; color: string }[];
  index: number;
  total: number;
  next_id: string | null;
  prev_id: string | null;
}

export interface DatasetSummary {
  project_id: string;
  name: string;
  annotation_type: string;
  mode: ProjectMode;
  total_images: number;
  labeled: number;
  unlabeled: number;
  total_boxes: number;
  classes: { name: string; color: string; count: number }[];
  splits: Record<string, number>;
}

export interface DatasetVersion {
  id: string;
  number: number;
  name: string;
  image_count: number;
  train_count: number;
  valid_count: number;
  test_count: number;
  created_at: string;
}

export interface EpochMetric {
  epoch: number;
  train_loss?: number | null;
  val_loss?: number | null;
  map50?: number | null;
  precision?: number | null;
  recall?: number | null;
}

export interface TrainingResults {
  map50: number;
  map50_95: number;
  precision: number;
  recall: number;
  f1: number;
  per_class: { name: string; precision: number; recall: number; map50: number }[];
  confusion_matrix: { labels: string[]; matrix: number[][] };
  confidence_curve: { confidence: number; f1: number; precision?: number; recall?: number }[];
  optimal_confidence: number;
}

export interface TrainingJob {
  id: string;
  project_id: string;
  version_id: string;
  engine: string;
  architecture: string;
  model_size: string;
  epochs_total: number;
  status: "awaiting_gpu" | "running" | "completed" | "failed";
  current_epoch: number;
  metrics: EpochMetric[];
  results: TrainingResults | null;
  error: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  ingest_token?: string;
  script_url?: string;
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
  project_id: string;
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
