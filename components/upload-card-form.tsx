"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import { emptyCardFields, type StoredCardResult } from "@/lib/types";

const STORAGE_KEY = "business-card-result";

type CaptureSide = "front" | "back";

type DraftCard = {
  id: string;
  frontFile: File | null;
  backFile: File | null;
  frontPreviewUrl: string;
  backPreviewUrl: string;
};

type CameraTarget = {
  cardId: string;
  side: CaptureSide;
};

function createDraftCard(): DraftCard {
  return {
    id: crypto.randomUUID(),
    frontFile: null,
    backFile: null,
    frontPreviewUrl: "",
    backPreviewUrl: ""
  };
}

export function UploadCardForm() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draftCards, setDraftCards] = useState<DraftCard[]>([createDraftCard()]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);

  useEffect(() => {
    setCameraSupported(
      typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }, []);

  const revokePreviewUrl = (url: string) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;

    if (stream instanceof MediaStream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setCameraTarget(null);
  };

  const updateCardFile = (cardId: string, side: CaptureSide, nextFile: File | null) => {
    setDraftCards((current) =>
      current.map((card) => {
        if (card.id !== cardId) {
          return card;
        }

        const previewKey = side === "front" ? "frontPreviewUrl" : "backPreviewUrl";
        const fileKey = side === "front" ? "frontFile" : "backFile";
        const previousUrl = card[previewKey];

        if (previousUrl) {
          revokePreviewUrl(previousUrl);
        }

        return {
          ...card,
          [fileKey]: nextFile,
          [previewKey]: nextFile ? URL.createObjectURL(nextFile) : ""
        };
      })
    );
  };

  const handleBulkFrontUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setError("");
    setDraftCards((current) => [
      ...current,
      ...files.map((file) => ({
        ...createDraftCard(),
        frontFile: file,
        frontPreviewUrl: URL.createObjectURL(file)
      }))
    ]);
    event.target.value = "";
  };

  const handleSingleFileChange =
    (cardId: string, side: CaptureSide) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setError("");
      updateCardFile(cardId, side, file);
    };

  const startCamera = async (target: CameraTarget) => {
    if (!cameraSupported) {
      setError("This browser does not support camera access.");
      return;
    }

    setError("");
    setIsStartingCamera(true);

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      if (!videoRef.current) {
        throw new Error("Camera preview is not available.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraTarget(target);
      setIsCameraOpen(true);
    } catch (cameraError) {
      setError(
        cameraError instanceof Error ? cameraError.message : "Unable to access the camera."
      );
    } finally {
      setIsStartingCamera(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraTarget) {
      setError("Camera is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera preview is still loading. Please try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Could not capture the photo.");
      return;
    }

    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.95);
    });

    if (!blob) {
      setError("Could not convert the captured photo.");
      return;
    }

    const file = new File([blob], `business-card-${cameraTarget.side}-${Date.now()}.jpg`, {
      type: "image/jpeg"
    });

    updateCardFile(cameraTarget.cardId, cameraTarget.side, file);
    stopCamera();
  };

  const removeCard = (cardId: string) => {
    setDraftCards((current) => {
      const next = current.filter((card) => card.id !== cardId);
      const removed = current.find((card) => card.id === cardId);

      if (removed) {
        revokePreviewUrl(removed.frontPreviewUrl);
        revokePreviewUrl(removed.backPreviewUrl);
      }

      return next.length > 0 ? next : [createDraftCard()];
    });
  };

  const addEmptyCard = () => {
    setDraftCards((current) => [...current, createDraftCard()]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cardsToProcess = draftCards.filter((card) => card.frontFile || card.backFile);

    if (cardsToProcess.length === 0) {
      setError("Add at least one business card before extracting.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const processedCards = [];

      for (const card of cardsToProcess) {
        const formData = new FormData();
        const files = [card.frontFile, card.backFile].filter((file): file is File => Boolean(file));

        for (const file of files) {
          formData.append("images", file);
        }

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Extraction failed.");
        }

        const { imageUrls, ...extractedFields } = payload as {
          imageUrls?: string[];
          [key: string]: unknown;
        };

        processedCards.push({
          id: card.id,
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          fields: {
            ...emptyCardFields,
            ...extractedFields
          }
        });
      }

      const result: StoredCardResult = {
        cards: processedCards
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      router.push("/result");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_18px_50px_rgba(23,32,51,0.08)] md:p-8"
    >
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Batch Import Cards</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Add multiple cards in one batch, upload front and back images, or use the browser camera
          for either side. We&apos;ll extract each card one by one and open a multi-record editor.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
          Import Front Images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulkFrontUpload}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={addEmptyCard}
          className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Add Empty Card
        </button>
      </div>

      {isCameraOpen ? (
        <div className="mt-6 space-y-4 rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(244,239,229,0.55),rgba(255,255,255,0.95))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm tracking-[0.18em] text-[var(--muted)] uppercase">Camera</p>
              <h3 className="text-lg font-semibold">
                Capturing {cameraTarget?.side === "back" ? "back side" : "front side"}
              </h3>
            </div>
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold"
            >
              Close
            </button>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[#0e1728]">
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <button
            type="button"
            onClick={capturePhoto}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          >
            Capture Photo
          </button>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {draftCards.map((card, index) => (
          <div
            key={card.id}
            className="rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(244,239,229,0.45),rgba(255,255,255,0.95))] p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm tracking-[0.18em] text-[var(--muted)] uppercase">
                  Card {index + 1}
                </p>
                <h3 className="text-lg font-semibold">Front and Back</h3>
              </div>
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold transition hover:border-red-300 hover:text-red-600"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(["front", "back"] as const).map((side) => {
                const previewUrl = side === "front" ? card.frontPreviewUrl : card.backPreviewUrl;

                return (
                  <div key={side} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize">{side} Side</span>
                      <div className="flex gap-2">
                        <label className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSingleFileChange(card.id, side)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => startCamera({ cardId: card.id, side })}
                          disabled={!cameraSupported || isStartingCamera}
                          className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Camera
                        </button>
                      </div>
                    </div>
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.1rem] border border-dashed border-[var(--border)] bg-[rgba(244,239,229,0.55)] text-center text-sm text-[var(--muted)]">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={`${side} preview`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{side === "front" ? "Front side" : "Back side"} image</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--foreground)] px-5 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Extracting batch..." : `Extract ${draftCards.filter((card) => card.frontFile || card.backFile).length || 0} Cards`}
      </button>
    </form>
  );
}
