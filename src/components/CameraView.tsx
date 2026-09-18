import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Check,
  Calendar,
  AlertCircle,
  FileText,
  Edit3,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { SimpleInterpretationCard } from './SimpleInterpretationCard';
import { ValidationModal } from './ValidationModal';
import { DirectInputView } from './DirectInputView';
import {
  MeasurementRecord,
  SheetReferenceRanges,
  SheetAnalysisResult,
  DocumentValidity,
  FieldStatus,
} from '../types';
import {
  analyzeSheetFile,
  fileToDataUrl,
  getFileIdentity,
} from '../utils/imageAnalyzer';

interface CameraViewProps {
  onClose: () => void;
  onSaveRecord: (data: {
    date?: string;
    weight: number;
    skeletalMuscle: number;
    bodyFatPercent: number;
    bodyFatMass: number;
    bmi: number;
    visceralFat: number;
    sourceType: 'camera' | 'gallery' | 'file';
    referenceRanges?: SheetReferenceRanges;
  }) => void;
  sourceType: 'camera' | 'gallery' | 'file';
  initialFile?: File | null;
  previousRecord?: MeasurementRecord;
}

type AnalysisStep = 'capturing' | 'preview' | 'scanning' | 'confirm' | 'direct-input';

export const CameraView: React.FC<CameraViewProps> = ({
  onClose,
  onSaveRecord,
  sourceType,
  initialFile = null,
  previousRecord,
}) => {
  // Step state
  const [step, setStep] = useState<AnalysisStep>(
    sourceType === 'camera' ? 'capturing' : initialFile ? 'preview' : 'capturing'
  );

  // File and preview states (strictly managed per-file, no state retention)
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  // Camera stream states
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation modal state
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<DocumentValidity>('analysis_error');
  const [validationReason, setValidationReason] = useState<string | undefined>(undefined);

  // Editable parsed data strings (NEVER initialized with sample values!)
  const [measurementDateStr, setMeasurementDateStr] = useState<string>('');
  const [weightStr, setWeightStr] = useState<string>('');
  const [skeletalMuscleStr, setSkeletalMuscleStr] = useState<string>('');
  const [bodyFatPercentStr, setBodyFatPercentStr] = useState<string>('');
  const [bodyFatMassStr, setBodyFatMassStr] = useState<string>('');
  const [bmiStr, setBmiStr] = useState<string>('');
  const [visceralFatStr, setVisceralFatStr] = useState<string>('');

  // Field statuses from analysis ('recognized' | 'uncertain' | 'missing')
  const [fieldStatuses, setFieldStatuses] = useState<{
    date: FieldStatus;
    weight: FieldStatus;
    muscle: FieldStatus;
    fatPercent: FieldStatus;
    fatMass: FieldStatus;
    bmi: FieldStatus;
    visceral: FieldStatus;
  }>({
    date: 'recognized',
    weight: 'recognized',
    muscle: 'recognized',
    fatPercent: 'recognized',
    fatMass: 'recognized',
    bmi: 'recognized',
    visceral: 'recognized',
  });

  // Reference ranges (ONLY set if detected from sheet, otherwise undefined)
  const [sheetRanges, setSheetRanges] = useState<SheetReferenceRanges | undefined>(undefined);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Active request tracking to prevent async race conditions
  const activeRequestIdRef = useRef<string>('');

  /**
   * Complete reset of all analysis and input states
   */
  const resetAllAnalysisState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCurrentFileId(null);
    setValidationModalOpen(false);
    setValidationError(null);
    setMeasurementDateStr('');
    setWeightStr('');
    setSkeletalMuscleStr('');
    setBodyFatPercentStr('');
    setBodyFatMassStr('');
    setBmiStr('');
    setVisceralFatStr('');
    setSheetRanges(undefined);
    setFieldStatuses({
      date: 'recognized',
      weight: 'recognized',
      muscle: 'recognized',
      fatPercent: 'recognized',
      fatMass: 'recognized',
      bmi: 'recognized',
      visceral: 'recognized',
    });
  };

  // Handle initialFile if provided on mount
  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  // Handle camera stream setup
  useEffect(() => {
    if (step === 'capturing' && sourceType === 'camera') {
      let isMounted = true;

      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        .then((stream) => {
          if (!isMounted) return;
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setHasCameraStream(true);
        })
        .catch((err) => {
          console.warn('Camera device not accessible:', err);
          setCameraError('카메라를 불러올 수 없습니다. 파일 등록 모드로 전환합니다.');
          setHasCameraStream(false);
        });

      return () => {
        isMounted = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  }, [step, sourceType]);

  /**
   * Handle user picking or capturing a new file
   */
  const handleFileSelected = async (file: File) => {
    resetAllAnalysisState();

    const identity = getFileIdentity(file);
    setCurrentFileId(identity.id);
    setSelectedFile(file);

    try {
      const dataUrl = await fileToDataUrl(file);
      setPreviewUrl(dataUrl);
      setStep('preview');
    } catch (err) {
      console.error('Failed to read file:', err);
      setValidationStatus('unsupported');
      setValidationReason('파일을 읽는 중 문제가 발생했습니다.');
      setValidationModalOpen(true);
    }
  };

  /**
   * Capture photo from camera stream
   */
  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const capturedFile = new File(
              [blob],
              `camera_scan_${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            );
            handleFileSelected(capturedFile);
          }
        },
        'image/jpeg',
        0.95
      );
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  /**
   * Start analysis of currently selected file
   */
  const handleStartAnalysis = async () => {
    if (!selectedFile || !previewUrl) return;

    setStep('scanning');
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    activeRequestIdRef.current = requestId;

    try {
      const result: SheetAnalysisResult = await analyzeSheetFile(
        selectedFile,
        previewUrl,
        requestId
      );

      // Prevent race conditions: check if this is still the active request
      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      // Check validity (CASE 2, CASE 3, CASE 4, etc.)
      if (result.validity !== 'valid') {
        setValidationStatus(result.validity);
        setValidationReason(result.validityReason);
        setValidationModalOpen(true);
        setStep('preview');
        return;
      }

      // Populate recognized fields and mark uncertain/missing fields
      const dateVal =
        result.measurementDate.value || new Date().toISOString().split('T')[0];
      setMeasurementDateStr(dateVal);

      setWeightStr(
        result.weight.value !== null ? result.weight.value.toFixed(1) : ''
      );
      setSkeletalMuscleStr(
        result.skeletalMuscleMass.value !== null
          ? result.skeletalMuscleMass.value.toFixed(1)
          : ''
      );
      setBodyFatMassStr(
        result.bodyFatMass.value !== null
          ? result.bodyFatMass.value.toFixed(1)
          : ''
      );
      setBmiStr(
        result.bmi.value !== null ? result.bmi.value.toFixed(1) : ''
      );
      setBodyFatPercentStr(
        result.bodyFatPercentage.value !== null
          ? result.bodyFatPercentage.value.toFixed(1)
          : ''
      );
      setVisceralFatStr(
        result.visceralFatLevel.value !== null
          ? result.visceralFatLevel.value.toString()
          : ''
      );

      // Track exact statuses
      setFieldStatuses({
        date: result.measurementDate.status,
        weight: result.weight.status,
        muscle: result.skeletalMuscleMass.status,
        fatPercent: result.bodyFatPercentage.status,
        fatMass: result.bodyFatMass.status,
        bmi: result.bmi.status,
        visceral: result.visceralFatLevel.status,
      });

      // Save recognized sheet ranges if any
      setSheetRanges(result.referenceRanges);

      // Check if all essential numeric fields are missing (Section 11)
      const hasAnyMetric =
        result.weight.value !== null ||
        result.skeletalMuscleMass.value !== null ||
        result.bodyFatPercentage.value !== null ||
        result.bodyFatMass.value !== null ||
        result.bmi.value !== null;

      if (!hasAnyMetric) {
        // Entire recognition failed to detect any metrics
        setValidationStatus('analysis_error');
        setValidationReason('결과지에서 핵심 체성분 수치를 읽지 못했습니다.');
        setValidationModalOpen(true);
        setStep('preview');
        return;
      }

      // Move to Confirm step with extracted values (NO file export or download)
      setStep('confirm');
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (activeRequestIdRef.current === requestId) {
        setValidationStatus('analysis_error');
        setValidationReason('결과지 분석 중 오류가 발생했습니다.');
        setValidationModalOpen(true);
        setStep('preview');
      }
    }
  };

  /**
   * Save confirmed measurements directly to BODY LOG app
   */
  const handleSave = () => {
    setValidationError(null);

    const weightNum = parseFloat(weightStr);
    const muscleNum = parseFloat(skeletalMuscleStr) || 0;
    const fatPercentNum = parseFloat(bodyFatPercentStr) || 0;
    const fatMassNum = parseFloat(bodyFatMassStr) || 0;
    const bmiNum = parseFloat(bmiStr) || 0;
    const visceralNum = parseInt(visceralFatStr, 10) || 0;

    if (isNaN(weightNum) || weightNum <= 0) {
      setValidationError('체중(kg)을 입력해주세요.');
      return;
    }

    onSaveRecord({
      date: measurementDateStr || new Date().toISOString().split('T')[0],
      weight: Number(weightNum.toFixed(1)),
      skeletalMuscle: Number(muscleNum.toFixed(1)),
      bodyFatPercent: Number(fatPercentNum.toFixed(1)),
      bodyFatMass: Number(fatMassNum.toFixed(1)),
      bmi: Number(bmiNum.toFixed(1)),
      visceralFat: visceralNum,
      sourceType,
      referenceRanges: sheetRanges,
    });
  };

  // Render Direct Input View if user switched to it
  if (step === 'direct-input') {
    return (
      <DirectInputView
        onClose={() => setStep(previewUrl ? 'preview' : 'capturing')}
        onSaveRecord={(data) => {
          onSaveRecord({
            ...data,
            sourceType,
          });
        }}
        previousRecord={previousRecord}
      />
    );
  }

  const hasMissingOrUncertainFields =
    fieldStatuses.weight !== 'recognized' ||
    fieldStatuses.muscle !== 'recognized' ||
    fieldStatuses.fatPercent !== 'recognized' ||
    fieldStatuses.fatMass !== 'recognized' ||
    fieldStatuses.bmi !== 'recognized' ||
    fieldStatuses.visceral !== 'recognized';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto h-full overflow-hidden">
      {/* Hidden file input for re-selecting files */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelected(file);
          }
        }}
      />

      {/* Top Header */}
      <header className="h-14 border-b border-[#eaecef] px-4 flex items-center justify-between shrink-0 bg-white z-10">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f6f3f2] flex items-center justify-center text-[#5a5f66] hover:bg-[#eae7e7] transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-bold text-[#1c1b1b]">
          {step === 'capturing'
            ? '결과지 촬영'
            : step === 'preview'
            ? '선택한 결과지'
            : step === 'scanning'
            ? '결과지 분석'
            : '분석 결과 확인'}
        </h1>
        <div className="w-9">
          {step === 'confirm' && (
            <button
              type="button"
              onClick={() => {
                resetAllAnalysisState();
                setStep(sourceType === 'camera' ? 'capturing' : 'preview');
              }}
              title="다시 스캔"
              className="w-9 h-9 rounded-full bg-[#f6f3f2] flex items-center justify-center text-[#5a5f66] hover:bg-[#eae7e7] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        {/* ========================================================
            STEP 1: CAMERA CAPTURING VIEW
           ======================================================== */}
        {step === 'capturing' && (
          <div className="flex-1 flex flex-col bg-[#1c1b1b] relative overflow-hidden">
            {hasCameraStream ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <Camera className="w-12 h-12 text-white/40" />
                <p className="text-[14px] text-white/80">
                  {cameraError || '카메라를 준비하고 있습니다...'}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#3867f4] text-white rounded-xl text-[13px] font-semibold"
                >
                  기기에서 파일 선택
                </button>
              </div>
            )}

            {/* Viewfinder Guide Overlay (Section 09 사진 촬영 UX) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
              {/* Guidance text badge */}
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-center mt-2 max-w-[90%]">
                <p className="text-[13px] font-semibold">
                  결과지 전체가 화면 안에 들어오도록 맞춰주세요.
                </p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  글자와 숫자가 선명하게 보이도록 촬영해주세요.
                </p>
              </div>

              {/* Document Outline Reticle */}
              <div className="w-[88%] aspect-[3/4] border-2 border-white/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#3867f4] rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#3867f4] rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#3867f4] rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#3867f4] rounded-br-md" />
              </div>

              <div className="h-20" />
            </div>

            {/* Shutter Controls */}
            <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-around z-10 shrink-0">
              <button
                type="button"
                onClick={() => setStep('direct-input')}
                className="text-white/80 hover:text-white text-[13px] font-medium flex flex-col items-center gap-1"
              >
                <Edit3 className="w-5 h-5" />
                <span>직접 입력</span>
              </button>

              <button
                type="button"
                onClick={handleCaptureFromCamera}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                aria-label="촬영"
              >
                <div className="w-16 h-16 rounded-full bg-[#3867f4] flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-white/80 hover:text-white text-[13px] font-medium flex flex-col items-center gap-1"
              >
                <FileText className="w-5 h-5" />
                <span>파일 선택</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: PREVIEW BEFORE ANALYSIS (Section 05)
           ======================================================== */}
        {step === 'preview' && selectedFile && previewUrl && (
          <div className="flex-1 flex flex-col p-5 space-y-4">
            <div className="space-y-1">
              <h2 className="text-[18px] font-bold text-[#1c1b1b] tracking-tight">
                선택한 결과지
              </h2>
              <p className="text-[13px] text-[#5a5f66]">
                결과지 전체와 숫자가 선명하게 보이는지 확인해주세요.
              </p>
            </div>

            {/* Image Preview Box */}
            <div className="flex-1 bg-[#f8f9fb] border border-[#eaecef] rounded-2xl p-2 flex items-center justify-center overflow-hidden min-h-[280px] max-h-[420px] relative">
              {selectedFile.type === 'application/pdf' ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <FileText className="w-16 h-16 text-[#3867f4]" />
                  <p className="text-[15px] font-bold text-[#1c1b1b]">
                    {selectedFile.name}
                  </p>
                  <span className="text-[12px] text-[#5a5f66]">PDF 문서 파일</span>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="선택된 결과지 미리보기"
                  className="max-h-full max-w-full object-contain rounded-xl shadow-xs"
                />
              )}
            </div>

            {/* File Info Meta */}
            <div className="bg-[#f8f9fb] border border-[#eaecef] rounded-xl px-4 py-3 flex items-center justify-between text-[13px]">
              <div className="truncate mr-3">
                <span className="text-[#8a9099] block text-[11px]">파일명</span>
                <span className="font-semibold text-[#1c1b1b] truncate block">
                  {selectedFile.name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[#8a9099] block text-[11px]">형식</span>
                <span className="font-semibold text-[#3867f4]">
                  {selectedFile.type ? selectedFile.type.split('/')[1]?.toUpperCase() : 'IMG'}
                </span>
              </div>
            </div>

            {/* Preview Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="w-full h-13 bg-[#3867f4] hover:bg-[#2e57d6] active:scale-[0.98] text-white font-semibold text-[15px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles className="w-5 h-5" />
                <span>분석하기</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (sourceType === 'camera') {
                      setStep('capturing');
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="h-11 bg-white hover:bg-[#f6f3f2] active:scale-[0.98] text-[#5a5f66] font-medium text-[13px] rounded-xl border border-[#e5e7eb] transition-all"
                >
                  {sourceType === 'camera' ? '사진 다시 찍기' : '다시 선택'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('direct-input')}
                  className="h-11 bg-white hover:bg-[#f6f3f2] active:scale-[0.98] text-[#5a5f66] font-medium text-[13px] rounded-xl border border-[#e5e7eb] transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#3867f4]" />
                  <span>직접 입력</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: SCANNING / ANALYZING VIEW (Section 14)
           ======================================================== */}
        {step === 'scanning' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            {/* Animated Document Scanner Icon */}
            <div className="relative w-28 h-28 rounded-3xl bg-[#eff3ff] flex items-center justify-center border border-[#dce1ff]">
              <FileText className="w-14 h-14 text-[#3867f4]" />
              {/* Scanning bar */}
              <div className="absolute inset-x-2 h-1 bg-[#3867f4] rounded-full animate-bounce shadow-md" />
            </div>

            <div className="space-y-2">
              <h3 className="text-[20px] font-bold text-[#1c1b1b] tracking-tight">
                결과지를 분석하고 있어요
              </h3>
              <p className="text-[14px] text-[#5a5f66]">
                체성분 정보를 확인하고 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-[#8a9099] bg-[#f8f9fb] px-4 py-2 rounded-full border border-[#eaecef]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3867f4]" />
              <span>실제 결과지 수치를 정밀하게 추출 중입니다</span>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: CONFIRMATION & EDIT VIEW (Section 09 & 10)
           ======================================================== */}
        {step === 'confirm' && (
          <div className="flex-1 p-5 space-y-6">
            <div className="space-y-1">
              <h2 className="text-[19px] font-bold text-[#1c1b1b] tracking-tight">
                분석 결과를 확인해주세요
              </h2>
              <p className="text-[13px] text-[#5a5f66] leading-relaxed whitespace-pre-line">
                {'결과지에서 읽은 정보를 확인하고\n필요한 값은 직접 수정할 수 있어요.'}
              </p>
            </div>

            {/* Validation warning if weight missing */}
            {validationError && (
              <div className="bg-[#fff1f0] border border-[#ffccc7] text-[#cf1322] px-3.5 py-2.5 rounded-xl text-[13px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Banner for partial/uncertain recognitions */}
            {hasMissingOrUncertainFields && (
              <div className="bg-[#f0f5ff] border border-[#d6e4ff] text-[#0958d9] px-3.5 py-2.5 rounded-xl text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>결과지에서 정확히 읽지 못했어요. 직접 입력해주세요.</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* 측정일 */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1c1b1b]">
                  측정일 <span className="text-[#3867f4]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={measurementDateStr}
                    onChange={(e) => setMeasurementDateStr(e.target.value)}
                    className="w-full h-12 px-3.5 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
                  />
                  <Calendar className="w-4 h-4 text-[#8a9099] absolute right-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              {/* 체중 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c1b1b]">
                      체중 <span className="text-[#3867f4]">*</span>
                    </label>
                    {fieldStatuses.weight !== 'recognized' && (
                      <span className="text-[10px] font-bold bg-[#fff0f6] text-[#c41d7f] px-1.5 py-0.5 rounded">
                        직접 입력 필요
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#8a9099]">단위: kg</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="값을 입력해주세요"
                    value={weightStr}
                    onChange={(e) => setWeightStr(e.target.value)}
                    className={`w-full h-12 px-3.5 pr-10 rounded-xl text-[15px] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all ${
                      fieldStatuses.weight !== 'recognized' && !weightStr
                        ? 'bg-[#f4f7ff] border border-[#3867f4]/40 text-[#1c1b1b]'
                        : 'bg-[#f8f9fb] border border-[#e5e7eb] text-[#1c1b1b]'
                    }`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* 골격근량 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c1b1b]">
                      골격근량
                    </label>
                    {fieldStatuses.muscle !== 'recognized' && (
                      <span className="text-[10px] font-medium bg-[#f5f5f5] text-[#8a9099] px-1.5 py-0.5 rounded">
                        직접 입력
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#8a9099]">단위: kg</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="값을 입력해주세요"
                    value={skeletalMuscleStr}
                    onChange={(e) => setSkeletalMuscleStr(e.target.value)}
                    className={`w-full h-12 px-3.5 pr-10 rounded-xl text-[15px] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all ${
                      fieldStatuses.muscle !== 'recognized' && !skeletalMuscleStr
                        ? 'bg-[#f4f7ff] border border-[#3867f4]/40 text-[#1c1b1b]'
                        : 'bg-[#f8f9fb] border border-[#e5e7eb] text-[#1c1b1b]'
                    }`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* 체지방량 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c1b1b]">
                      체지방량
                    </label>
                    {fieldStatuses.fatMass !== 'recognized' && (
                      <span className="text-[10px] font-medium bg-[#f5f5f5] text-[#8a9099] px-1.5 py-0.5 rounded">
                        직접 입력
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#8a9099]">단위: kg</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="값을 입력해주세요"
                    value={bodyFatMassStr}
                    onChange={(e) => setBodyFatMassStr(e.target.value)}
                    className={`w-full h-12 px-3.5 pr-10 rounded-xl text-[15px] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all ${
                      fieldStatuses.fatMass !== 'recognized' && !bodyFatMassStr
                        ? 'bg-[#f4f7ff] border border-[#3867f4]/40 text-[#1c1b1b]'
                        : 'bg-[#f8f9fb] border border-[#e5e7eb] text-[#1c1b1b]'
                    }`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* BMI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c1b1b]">
                      BMI
                    </label>
                    {fieldStatuses.bmi !== 'recognized' && (
                      <span className="text-[10px] font-medium bg-[#f5f5f5] text-[#8a9099] px-1.5 py-0.5 rounded">
                        직접 입력
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#8a9099]">단위: kg/m²</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="값을 입력해주세요"
                  value={bmiStr}
                  onChange={(e) => setBmiStr(e.target.value)}
                  className={`w-full h-12 px-3.5 rounded-xl text-[15px] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all ${
                    fieldStatuses.bmi !== 'recognized' && !bmiStr
                      ? 'bg-[#f4f7ff] border border-[#3867f4]/40 text-[#1c1b1b]'
                      : 'bg-[#f8f9fb] border border-[#e5e7eb] text-[#1c1b1b]'
                  }`}
                />
              </div>

              {/* 체지방률 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c1b1b]">
                      체지방률
                    </label>
                    {fieldStatuses.fatPercent !== 'recognized' && (
                      <span className="text-[10px] font-medium bg-[#f5f5f5] text-[#8a9099] px-1.5 py-0.5 rounded">
                        직접 입력
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#8a9099]">단위: %</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="값을 입력해주세요"
                    value={bodyFatPercentStr}
                    onChange={(e) => setBodyFatPercentStr(e.target.value)}
                    className={`w-full h-12 px-3.5 pr-10 rounded-xl text-[15px] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all ${
                      fieldStatuses.fatPercent !== 'recognized' && !bodyFatPercentStr
                        ? 'bg-[#f4f7ff] border border-[#3867f4]/40 text-[#1c1b1b]'
                        : 'bg-[#f8f9fb] border border-[#e5e7eb] text-[#1c1b1b]'
                    }`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* 내장지방레벨 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c1b1b]">
                      내장지방레벨
                    </label>
                    {fieldStatuses.visceral !== 'recognized' && (
                      <span className="text-[10px] font-medium bg-[#f5f5f5] text-[#8a9099] px-1.5 py-0.5 rounded">
                        직접 입력
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#8a9099]">단위: Lv</span>
                </div>
                <input
                  type="number"
                  step="1"
                  placeholder="값을 입력해주세요"
                  value={visceralFatStr}
                  onChange={(e) => setVisceralFatStr(e.target.value)}
                  className={`w-full h-12 px-3.5 rounded-xl text-[15px] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all ${
                    fieldStatuses.visceral !== 'recognized' && !visceralFatStr
                      ? 'bg-[#f4f7ff] border border-[#3867f4]/40 text-[#1c1b1b]'
                      : 'bg-[#f8f9fb] border border-[#e5e7eb] text-[#1c1b1b]'
                  }`}
                />
              </div>
            </div>

            {/* Simple Interpretation Card (Section 17, 18, 19) */}
            <div className="pt-2">
              <SimpleInterpretationCard
                currentValues={{
                  weight: parseFloat(weightStr) || 0,
                  skeletalMuscle: parseFloat(skeletalMuscleStr) || 0,
                  bodyFatPercent: parseFloat(bodyFatPercentStr) || 0,
                  bodyFatMass: parseFloat(bodyFatMassStr) || 0,
                  bmi: parseFloat(bmiStr) || 0,
                  visceralFat: parseInt(visceralFatStr, 10) || 0,
                }}
                referenceRanges={sheetRanges}
                previousRecord={previousRecord}
                variant="light"
              />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Controls for Confirm Step */}
      {step === 'confirm' && (
        <footer className="p-4 border-t border-[#eaecef] bg-white shrink-0 space-y-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-12 bg-[#3867f4] hover:bg-[#2e57d6] active:scale-[0.98] text-white font-semibold text-[15px] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check className="w-5 h-5" />
            <span>저장하기</span>
          </button>
          <button
            type="button"
            onClick={() => {
              resetAllAnalysisState();
              if (sourceType === 'camera') {
                setStep('capturing');
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="w-full h-10 bg-white hover:bg-[#f6f3f2] active:scale-[0.98] text-[#5a5f66] font-medium text-[13px] rounded-xl border border-[#e5e7eb] transition-all"
          >
            다시 선택하기
          </button>
        </footer>
      )}

      {/* Validation Feedback Modal */}
      <ValidationModal
        isOpen={validationModalOpen}
        validity={validationStatus}
        reason={validationReason}
        sourceType={sourceType}
        onRetry={() => {
          setValidationModalOpen(false);
          resetAllAnalysisState();
          if (sourceType === 'camera') {
            setStep('capturing');
          } else {
            fileInputRef.current?.click();
          }
        }}
        onDirectInput={() => {
          setValidationModalOpen(false);
          setStep('direct-input');
        }}
        onClose={() => {
          setValidationModalOpen(false);
        }}
      />
    </div>
  );
};
