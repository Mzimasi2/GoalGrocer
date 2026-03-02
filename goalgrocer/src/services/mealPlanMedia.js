import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

function safeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uploadMealPlanImage({ file, planId, day, slot }) {
  if (!file) throw new Error("No image file selected.");
  if (!planId || !day || !slot) throw new Error("Missing meal image metadata.");

  const ext = String(file.name || "jpg").split(".").pop() || "jpg";
  const fileName = `${Date.now()}.${safeSegment(ext)}`;
  const path = `meal-plans/${safeSegment(planId)}/${safeSegment(day)}/${safeSegment(slot)}/${fileName}`;
  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(imageRef);
}
