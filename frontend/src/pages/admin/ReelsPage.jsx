import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Camera, Edit, Eye, EyeOff, Film, Plus, Search, Trash2, Upload, X,
} from 'lucide-react';
import * as reelService from '@/services/reelService';
import * as productService from '@/services/productService';
import { useUIStore } from '@/stores/useUIStore';
import { getErrorMessage, getFieldErrors } from '@/lib/apiError';
import { mediaUrl } from '@/lib/media';
import { formatPrice } from '@/lib/formatters';
import { FALLBACK_IMAGE } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SmartImage from '@/components/ui/SmartImage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';

const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const PAGE_LINK = /^https?:\/\/([a-z0-9-]+\.)*(instagram\.com|instagr\.am|youtube\.com|youtu\.be|facebook\.com|fb\.watch)(\/|$)/i;

function emptyForm(sortOrder = 0) {
  return {
    id: null,
    title: '',
    videoUrl: '',
    coverUrl: '',
    product: null,
    sortOrder,
    isActive: true,
  };
}

/** Search box that picks one product (optional link under the video). */
function ProductPicker({ value, onChange, error }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await productService.search(term);
        if (!cancelled) setResults((data.items || []).slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [term]);

  if (value) {
    return (
      <div>
        <div className="flex items-center gap-3 p-2 pr-3 border border-neutral-200 rounded-lg">
          <SmartImage src={value.image || FALLBACK_IMAGE} alt="" containerClassName="w-10 h-12 rounded overflow-hidden shrink-0" className="w-full h-full" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-800 truncate">{value.name}</p>
            {value.price != null && <p className="text-xs text-neutral-500">{formatPrice(value.price)}</p>}
          </div>
          <button type="button" onClick={() => onChange(null)} className="p-1 text-neutral-400 hover:text-neutral-700" aria-label="Remove product link">
            <X size={16} />
          </button>
        </div>
        {error && <p className="text-sm text-error mt-1.5">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        icon={Search}
        placeholder="Search products by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        error={error}
      />
      {term.length >= 2 && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {searching && results.length === 0 && <p className="p-3 text-sm text-neutral-500">Searching...</p>}
          {!searching && results.length === 0 && <p className="p-3 text-sm text-neutral-500">No products match "{term}".</p>}
          {results.map((p) => {
            const variant = p.variants?.[0];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange({ id: p.id, name: p.name, slug: p.slug, price: variant?.price ?? p.basePrice ?? null, image: variant?.images?.[0] || null });
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 p-2 text-left hover:bg-neutral-50"
              >
                <SmartImage src={variant?.images?.[0] || FALLBACK_IMAGE} alt="" containerClassName="w-9 h-11 rounded overflow-hidden shrink-0" className="w-full h-full" />
                <span className="flex-1 min-w-0 text-sm text-neutral-800 truncate">{p.name}</span>
                {variant && <span className="text-xs text-neutral-500 shrink-0">{formatPrice(variant.price)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReelTile({ reel, index, total, onEdit, onToggle, onMove, onDelete, busy }) {
  return (
    <div className={cn('bg-white border border-neutral-100 rounded-xl overflow-hidden flex flex-col', !reel.isActive && 'opacity-70')}>
      <button type="button" onClick={onEdit} className="relative aspect-[9/16] bg-neutral-100 block" title="Edit">
        <SmartImage src={reel.coverUrl || FALLBACK_IMAGE} alt="" containerClassName="absolute inset-0" className="w-full h-full" />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/90 text-neutral-800">
          #{index + 1}
        </span>
        <span
          className={cn(
            'absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium',
            reel.isActive ? 'bg-green-600 text-white' : 'bg-neutral-800 text-white'
          )}
        >
          {reel.isActive ? 'Showing' : 'Hidden'}
        </span>
        {!reel.videoUrl && (
          <span className="absolute inset-x-2 bottom-2 flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-[11px]">
            <AlertCircle size={12} /> No video
          </span>
        )}
      </button>
      <div className="p-3 flex-1 flex flex-col gap-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800 line-clamp-2">{reel.title || <span className="text-neutral-400 font-normal">No caption</span>}</p>
        <p className="text-xs text-neutral-500 truncate">{reel.product ? `Links to: ${reel.product.name}` : 'No product linked'}</p>
      </div>
      <div className="flex items-center justify-between gap-1 px-2 pb-2">
        <div className="flex items-center">
          <button type="button" onClick={() => onMove(-1)} disabled={busy || index === 0} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30" title="Move earlier">
            <ArrowLeft size={15} className="text-neutral-600" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={busy || index === total - 1} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30" title="Move later">
            <ArrowRight size={15} className="text-neutral-600" />
          </button>
        </div>
        <div className="flex items-center">
          <button type="button" onClick={onToggle} disabled={busy} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30" title={reel.isActive ? 'Hide from website' : 'Show on website'}>
            {reel.isActive ? <EyeOff size={15} className="text-neutral-600" /> : <Eye size={15} className="text-neutral-600" />}
          </button>
          <button type="button" onClick={onEdit} className="p-1.5 rounded-lg hover:bg-neutral-100" title="Edit">
            <Edit size={15} className="text-neutral-600" />
          </button>
          <button type="button" onClick={onDelete} disabled={busy} className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-30" title="Delete">
            <Trash2 size={15} className="text-neutral-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [reels, setReels] = useState([]);
  const [limits, setLimits] = useState({ maxVideoMb: 50, maxImageMb: 5 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [useLink, setUseLink] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const previewVideoRef = useRef(null);

  const reload = useCallback(async () => {
    try {
      const data = await reelService.adminList();
      setReels(data.items || []);
      setLimits({ maxVideoMb: data.maxVideoMb || 50, maxImageMb: data.maxImageMb || 5 });
      setLoadError('');
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load the reels.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Free local preview URLs when they are replaced or the page closes.
  useEffect(() => () => { if (videoPreview) URL.revokeObjectURL(videoPreview); }, [videoPreview]);
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  const openForm = (form) => {
    setEditing(form);
    setErrors({});
    setVideoFile(null);
    setVideoPreview('');
    setCoverFile(null);
    setCoverPreview('');
    setUploadProgress(null);
    setUseLink(Boolean(form.videoUrl) && !form.videoUrl.includes('/uploads/'));
  };

  const startNew = () => {
    const next = reels.length ? Math.max(...reels.map((r) => r.sortOrder || 0)) + 1 : 0;
    openForm(emptyForm(next));
  };

  const startEdit = (reel) => openForm({
    id: reel.id,
    title: reel.title || '',
    videoUrl: reel.videoUrl || '',
    coverUrl: reel.coverUrl || '',
    product: reel.product || null,
    sortOrder: reel.sortOrder ?? 0,
    isActive: reel.isActive,
  });

  const setField = (field, value) => {
    setEditing((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const pickVideo = (file) => {
    if (!file) return;
    if (file.type === 'video/quicktime' || /\.mov$/i.test(file.name)) {
      setErrors((prev) => ({ ...prev, videoUrl: 'MOV videos do not play on every phone. Save or export the video as MP4 and upload that.' }));
      return;
    }
    if (!VIDEO_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, videoUrl: 'Upload the video as an MP4 (or WebM) file' }));
      return;
    }
    if (file.size > limits.maxVideoMb * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, videoUrl: `The video must be ${limits.maxVideoMb} MB or smaller (this one is ${Math.ceil(file.size / 1048576)} MB)` }));
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, videoUrl: undefined }));
  };

  const pickCover = (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, coverUrl: 'Use a JPG, PNG, WebP or AVIF picture' }));
      return;
    }
    if (file.size > limits.maxImageMb * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, coverUrl: `The picture must be ${limits.maxImageMb} MB or smaller` }));
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, coverUrl: undefined }));
  };

  /** Uses the frame showing in the video preview as the cover picture. */
  const takeFrameAsCover = () => {
    const video = previewVideoRef.current;
    if (!video || !video.videoWidth) {
      addToast({ type: 'error', message: 'Play the video to the moment you want, then try again.' });
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        addToast({ type: 'error', message: 'Could not take a picture from this video. Upload a cover picture instead.' });
        return;
      }
      pickCover(new File([blob], 'cover.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.85);
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setEditing((prev) => ({ ...prev, videoUrl: '' }));
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setEditing((prev) => ({ ...prev, coverUrl: '' }));
  };

  const validate = () => {
    const e = {};
    const link = editing.videoUrl.trim();
    if (!videoFile && !link) e.videoUrl = 'Please upload the reel video';
    else if (!videoFile && PAGE_LINK.test(link)) {
      e.videoUrl = 'Instagram, YouTube and Facebook links cannot be played on the website. Download the video and upload the file instead.';
    } else if (!videoFile && !/^(https?:\/\/|\/)\S+$/i.test(link)) e.videoUrl = 'Enter a link that starts with https://';
    if (!coverFile && !editing.coverUrl) e.coverUrl = 'Please upload a cover picture';
    if (editing.title.trim().length > 150) e.title = 'Keep the caption under 150 characters';
    const order = Number(editing.sortOrder);
    if (!Number.isInteger(order) || order < 0) e.sortOrder = 'Use a whole number, 0 or more';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    try {
      let { videoUrl, coverUrl } = editing;
      if (videoFile) {
        setUploadProgress(0);
        videoUrl = await reelService.uploadVideo(videoFile, setUploadProgress);
        // Keep the uploaded URL so trying again after an error does not upload the file twice.
        setEditing((prev) => ({ ...prev, videoUrl }));
        setVideoFile(null);
        setUploadProgress(null);
      }
      if (coverFile) {
        coverUrl = await reelService.uploadCover(coverFile);
        setEditing((prev) => ({ ...prev, coverUrl }));
        setCoverFile(null);
        setCoverPreview('');
      }
      const payload = {
        title: editing.title.trim() || null,
        videoUrl: videoUrl.trim(),
        coverUrl,
        productId: editing.product?.id ?? null,
        sortOrder: Number(editing.sortOrder) || 0,
        isActive: editing.isActive,
      };
      if (editing.id == null) {
        await reelService.create({ ...payload, product: editing.product });
        addToast({ type: 'success', message: 'Reel added' });
      } else {
        await reelService.update(editing.id, { ...payload, product: editing.product });
        addToast({ type: 'success', message: 'Reel updated' });
      }
      setEditing(null);
      await reload();
    } catch (error) {
      setUploadProgress(null);
      setErrors(getFieldErrors(error));
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not save the reel.') });
    }
    setSaving(false);
  };

  const toggleActive = async (reel) => {
    setBusy(true);
    try {
      await reelService.update(reel.id, { isActive: !reel.isActive });
      addToast({ type: 'success', message: reel.isActive ? 'Hidden from the website' : 'Showing on the website' });
      await reload();
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not update the reel.') });
    }
    setBusy(false);
  };

  /** Moves a reel one place and saves the new order (numbers 0, 1, 2, ...). */
  const move = async (index, step) => {
    const target = index + step;
    if (target < 0 || target >= reels.length) return;
    const order = [...reels];
    [order[index], order[target]] = [order[target], order[index]];
    setReels(order);
    setBusy(true);
    try {
      await Promise.all(order.map((reel, i) => (
        reel.sortOrder === i ? null : reelService.update(reel.id, { sortOrder: i })
      )));
      await reload();
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not change the order.') });
      await reload();
    }
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reelService.remove(deleteTarget.id);
      addToast({ type: 'success', message: 'Reel deleted' });
      if (editing?.id === deleteTarget.id) setEditing(null);
      await reload();
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not delete the reel.') });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (loading) return <LoadingSpinner />;

  const shownVideo = videoPreview || (!useLink && editing?.videoUrl ? mediaUrl(editing.videoUrl) : '');
  const shownCover = coverPreview || editing?.coverUrl || '';
  const showingCount = reels.filter((r) => r.isActive).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Reels</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Short videos shown in &ldquo;See it in action&rdquo; on the home page. {showingCount} showing on the website.
          </p>
        </div>
        <Button onClick={startNew} disabled={Boolean(loadError)}>
          <Plus size={16} className="mr-2" /> Add Reel
        </Button>
      </div>

      {loadError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 text-sm flex gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
        <div>
          {!loadError && reels.length === 0 && (
            <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-10 text-center">
              <Film size={32} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-700 font-medium">No reels yet</p>
              <p className="text-sm text-neutral-500 mt-1">Add your first video. The section appears on the home page as soon as one reel is showing.</p>
              <Button onClick={startNew} className="mt-4"><Plus size={16} className="mr-2" /> Add Reel</Button>
            </div>
          )}
          {reels.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {reels.map((reel, i) => (
                <ReelTile
                  key={reel.id}
                  reel={reel}
                  index={i}
                  total={reels.length}
                  busy={busy}
                  onEdit={() => startEdit(reel)}
                  onToggle={() => toggleActive(reel)}
                  onMove={(step) => move(i, step)}
                  onDelete={() => setDeleteTarget(reel)}
                />
              ))}
            </div>
          )}
          {reels.length > 1 && (
            <p className="text-xs text-neutral-500 mt-3">Use the arrows to change the order. #1 is shown first.</p>
          )}
        </div>

        {editing && (
          <div className="bg-white border border-neutral-100 rounded-xl p-5 xl:sticky xl:top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editing.id == null ? 'Add Reel' : 'Edit Reel'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 text-neutral-400 hover:text-neutral-600" aria-label="Close" disabled={saving}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Video */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-neutral-700">Video <span className="text-red-500">*</span></span>
                  <button
                    type="button"
                    onClick={() => { setUseLink(!useLink); setErrors((p) => ({ ...p, videoUrl: undefined })); }}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    {useLink ? 'Upload a file instead' : 'Use a video link instead'}
                  </button>
                </div>
                {useLink && !videoFile ? (
                  <Input
                    placeholder="https://.../video.mp4"
                    value={editing.videoUrl}
                    onChange={(e) => setField('videoUrl', e.target.value)}
                    error={errors.videoUrl}
                  />
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      {shownVideo ? (
                        <div className="relative w-32 aspect-[9/16] rounded-lg overflow-hidden bg-black shrink-0">
                          <video
                            ref={previewVideoRef}
                            src={shownVideo}
                            controls
                            playsInline
                            muted
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearVideo}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
                            aria-label="Remove video"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className={cn(
                          'w-32 aspect-[9/16] rounded-lg border-2 border-dashed flex items-center justify-center shrink-0',
                          errors.videoUrl ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                        )}>
                          <Film size={24} className="text-neutral-300" />
                        </div>
                      )}
                      <div className="space-y-2 min-w-0">
                        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                          <Upload size={14} /> {shownVideo ? 'Replace video' : 'Upload video'}
                          <input
                            type="file"
                            accept="video/mp4,video/webm,.mp4,.webm"
                            className="hidden"
                            onChange={(e) => { pickVideo(e.target.files?.[0]); e.target.value = ''; }}
                          />
                        </label>
                        <p className="text-xs text-neutral-500">
                          MP4, up to {limits.maxVideoMb} MB. Upright (9:16) videos look best. Reels you download from Instagram are already MP4.
                        </p>
                        {videoFile && (
                          <button
                            type="button"
                            onClick={takeFrameAsCover}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                          >
                            <Camera size={13} /> Use the frame showing as the cover
                          </button>
                        )}
                      </div>
                    </div>
                    {errors.videoUrl && <p className="text-sm text-error mt-1.5">{errors.videoUrl}</p>}
                    {uploadProgress !== null && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                          <span>Uploading video...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Cover */}
              <div>
                <span className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Cover picture <span className="text-red-500">*</span>
                </span>
                <div className="flex items-start gap-4">
                  {shownCover ? (
                    <div className="relative w-32 aspect-[9/16] rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                      <SmartImage src={shownCover} alt="" containerClassName="w-full h-full" className="w-full h-full" />
                      <button
                        type="button"
                        onClick={clearCover}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
                        aria-label="Remove cover"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className={cn(
                      'w-32 aspect-[9/16] rounded-lg border-2 border-dashed flex items-center justify-center shrink-0',
                      errors.coverUrl ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                    )}>
                      <Upload size={22} className="text-neutral-300" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                      <Upload size={14} /> {shownCover ? 'Replace picture' : 'Upload picture'}
                      <input
                        type="file"
                        accept={IMAGE_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = ''; }}
                      />
                    </label>
                    <p className="text-xs text-neutral-500">
                      Shown before the video plays. JPG, PNG or WebP, up to {limits.maxImageMb} MB, upright (9:16).
                    </p>
                  </div>
                </div>
                {errors.coverUrl && <p className="text-sm text-error mt-1.5">{errors.coverUrl}</p>}
              </div>

              <Input
                label="Caption (optional)"
                placeholder="For example: New festive silks are here"
                value={editing.title}
                maxLength={150}
                onChange={(e) => setField('title', e.target.value)}
                error={errors.title}
              />

              <div>
                <span className="block text-sm font-medium text-neutral-700 mb-1.5">Product shown with the video (optional)</span>
                <ProductPicker value={editing.product} onChange={(p) => setField('product', p)} error={errors.productId} />
                <p className="text-xs text-neutral-500 mt-1.5">Customers watching the video get a &ldquo;Shop now&rdquo; button for this product.</p>
              </div>

              <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 cursor-pointer">
                <span>
                  <span className="block text-sm font-medium text-neutral-800">Show on the website</span>
                  <span className="block text-xs text-neutral-500">Turn off to keep the reel here without showing it.</span>
                </span>
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                  className="w-5 h-5 accent-primary-500"
                />
              </label>

              <div className="flex gap-3 pt-1">
                <Button onClick={handleSave} isLoading={saving}>
                  {saving && uploadProgress !== null ? `Uploading ${uploadProgress}%` : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Reel"
        message="Delete this reel? Its video and cover picture are removed from the website."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
