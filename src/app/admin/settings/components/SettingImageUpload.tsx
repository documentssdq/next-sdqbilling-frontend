"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button, FormControl, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import Icon from "@/components/wrappers/Icon";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { WebsiteSettingItem } from "../../dataStore";

interface SettingImageUploadProps {
  item: WebsiteSettingItem;
  canWrite: boolean;
  onUpdateValue: (id: string, newValue: string) => Promise<void>;
}

const getImageSrc = (url: string) => {
  if (!url) return "";
  if (
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("/")
  ) {
    return url;
  }
  return `/uploads/${url}`;
};

const toBase64 = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const SettingImageUpload: React.FC<SettingImageUploadProps> = ({
  item,
  canWrite,
  onUpdateValue,
}) => {
  const currentValue = typeof item.value === "string" ? item.value : "";
  const [imagePreview, setImagePreview] = useState<string>(
    item.previewUrl || currentValue || ""
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showManualUrl, setShowManualUrl] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const val = typeof item.value === "string" ? item.value : "";
    setImagePreview(item.previewUrl || val || "");
    setImgError(false);
  }, [item.value, item.previewUrl]);

  const keyLower = (item.key || "").toLowerCase();
  const nameLower = (item.displayName || "").toLowerCase();
  const isLogo = keyLower.includes("logo") || nameLower.includes("logo");
  const isFavicon = keyLower.includes("favicon") || nameLower.includes("favicon");

  const acceptedFormats = isFavicon
    ? ".ico,.png,.svg,.webp,.jpg,.jpeg,image/x-icon,image/png,image/svg+xml"
    : ".png,.svg,.webp,.jpg,.jpeg,image/png,image/svg+xml,image/webp,image/jpeg";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Immediate preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setImgError(false);
    setIsUploading(true);

    try {
      const base64Image = await toBase64(file);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || sessionStorage.getItem("token")
          : null;

      const folderName = isLogo ? "logos" : isFavicon ? "favicons" : "settings";

      const res = await fetch("/api/proxy-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          base64: base64Image,
          filename: file.name,
          folder: folderName,
        }),
      });

      const data = await res.json();
      const uploadedUrl = data?.data?.url || data?.url || "";

      if (uploadedUrl) {
        setImagePreview(uploadedUrl);
        await onUpdateValue(item.id, uploadedUrl);
        toast.success(
          `${item.displayName || "Image"} uploaded and saved successfully!`
        );
      } else {
        throw new Error(data?.message || "Failed to receive uploaded URL");
      }
    } catch (err: any) {
      console.error("Setting image upload error:", err);
      toast.error(`Upload error: ${err.message || "Failed to upload image"}`);
      setImagePreview(currentValue);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!currentValue && !imagePreview) return;

    const result = await Swal.fire({
      title: `Remove ${item.displayName}?`,
      text: `Are you sure you want to remove the current ${item.displayName.toLowerCase()}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setIsUploading(true);
      try {
        if (currentValue && currentValue.includes("/uploads/")) {
          try {
            await fetch("/api/proxy-delete-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: currentValue }),
            });
          } catch (e) {
            console.warn("Delete image error", e);
          }
        }

        await onUpdateValue(item.id, "");
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success(`${item.displayName} removed successfully!`);
      } catch (err: any) {
        toast.error("Failed to remove image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const hasImage = Boolean(imagePreview && !imgError);

  return (
    <div className="setting-image-upload-wrapper p-3 bg-light rounded-3 border">
      <div className="d-flex flex-wrap align-items-center gap-3">
        {/* Profile-Image-Style Preview Box */}
        <div
          className="position-relative d-inline-block"
          style={{
            width: isLogo ? 130 : 80,
            height: 80,
            flexShrink: 0,
          }}
        >
          <div
            className="border rounded-3 overflow-hidden bg-white d-flex align-items-center justify-content-center w-100 h-100 shadow-sm"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
              backgroundSize: "14px 14px",
              backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
            }}
          >
            {hasImage ? (
              <img
                src={getImageSrc(imagePreview)}
                alt={item.displayName}
                className="p-1"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="text-secondary d-flex flex-column align-items-center justify-content-center opacity-50">
                <Icon
                  icon={isLogo ? "image" : isFavicon ? "globe" : "file-image"}
                  className="fs-1"
                />
              </div>
            )}
          </div>

          {/* Red remove button matching Profile Photo */}
          {(hasImage || Boolean(currentValue)) && canWrite && !isUploading && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`tooltip-rm-${item.id}`}>
                  Remove {item.displayName}
                </Tooltip>
              }
            >
              <button
                type="button"
                className="btn btn-danger position-absolute p-0 d-flex align-items-center justify-content-center rounded-circle shadow"
                style={{
                  width: 24,
                  height: 24,
                  top: -8,
                  right: -8,
                  zIndex: 10,
                }}
                onClick={handleRemoveImage}
              >
                <Icon icon="x" className="fs-13" />
              </button>
            </OverlayTrigger>
          )}
        </div>

        {/* Upload Controls & Metadata */}
        <div className="flex-grow-1" style={{ minWidth: "240px" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            className="d-none"
            disabled={!canWrite || isUploading}
            onChange={handleFileChange}
          />

          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-1 fw-semibold px-3 py-1"
              disabled={!canWrite || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Icon icon="camera" className="fs-14" />
                  <span>
                    {hasImage
                      ? `Change ${isLogo ? "Logo" : isFavicon ? "Favicon" : "Image"}`
                      : `Upload ${isLogo ? "Logo" : isFavicon ? "Favicon" : "Image"}`}
                  </span>
                </>
              )}
            </Button>

            {hasImage && (
              <a
                href={getImageSrc(imagePreview)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-2 py-1"
              >
                <Icon icon="external-link" className="fs-13" />
                <span>View Full</span>
              </a>
            )}

            <Button
              variant="link"
              size="sm"
              className="text-muted p-0 text-decoration-none fs-12 ms-auto"
              onClick={() => setShowManualUrl(!showManualUrl)}
            >
              {showManualUrl ? "Hide manual URL" : "Enter URL manually"}
            </Button>
          </div>

          {showManualUrl && (
            <div className="mt-2 mb-1">
              <FormControl
                type="text"
                size="sm"
                placeholder="Or paste direct image path / URL (e.g. /images/logo.png)"
                value={currentValue}
                disabled={!canWrite}
                onChange={(e) => {
                  setImagePreview(e.target.value);
                  onUpdateValue(item.id, e.target.value);
                }}
                className="bg-white font-monospace fs-12"
              />
            </div>
          )}

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2">
            <span className="text-muted fs-11">
              {isFavicon
                ? "Recommended: 32×32px or 64×64px (.ico, .png, or .svg). Max 2MB."
                : isLogo
                  ? "Recommended: Transparent PNG or SVG (approx. 200×60px). Max 2MB."
                  : "Accepted formats: PNG, JPG, JPEG, WEBP, SVG. Max size: 2MB."}
            </span>

            {currentValue && (
              <span className="text-muted fs-11 font-monospace">
                Current: <span className="text-dark">{currentValue.split("/").pop()}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingImageUpload;

