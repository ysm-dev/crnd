export default function isOverlapPolicy(value: string): value is "skip" | "allow" {
  return value === "skip" || value === "allow";
}
