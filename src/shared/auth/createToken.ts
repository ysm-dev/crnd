import { ulid } from "ulid";

export default function createToken() {
  return ulid();
}
