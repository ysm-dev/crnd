import escapeXml from "./escapeXml";

export default function createLaunchdPlist(
  args: string[],
  stdoutPath: string,
  stderrPath: string
) {
  const items = args.map((arg) => `    <string>${escapeXml(arg)}</string>`).join("\n");
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">",
    "<plist version=\"1.0\">",
    "  <dict>",
    "    <key>Label</key>",
    "    <string>com.crnd.daemon</string>",
    "    <key>ProgramArguments</key>",
    "    <array>",
    items,
    "    </array>",
    "    <key>RunAtLoad</key>",
    "    <true/>",
    "    <key>KeepAlive</key>",
    "    <true/>",
    "    <key>StandardOutPath</key>",
    `    <string>${escapeXml(stdoutPath)}</string>`,
    "    <key>StandardErrorPath</key>",
    `    <string>${escapeXml(stderrPath)}</string>`,
    "  </dict>",
    "</plist>",
    ""
  ].join("\n");
}
