class Crnd < Formula
  desc "Agent-first CLI for cron scheduling and process management"
  homepage "https://github.com/ysm-dev/crnd"
  license "MIT"
  version "0.0.1"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/ysm-dev/crnd/releases/download/v#{version}/crnd-darwin-arm64.tar.gz"
      sha256 "PLACEHOLDER_DARWIN_ARM64"
    else
      url "https://github.com/ysm-dev/crnd/releases/download/v#{version}/crnd-darwin-x64.tar.gz"
      sha256 "PLACEHOLDER_DARWIN_X64"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/ysm-dev/crnd/releases/download/v#{version}/crnd-linux-arm64.tar.gz"
      sha256 "PLACEHOLDER_LINUX_ARM64"
    else
      url "https://github.com/ysm-dev/crnd/releases/download/v#{version}/crnd-linux-x64.tar.gz"
      sha256 "PLACEHOLDER_LINUX_X64"
    end
  end

  def install
    bin.install "crnd"
  end

  test do
    assert_match "crnd", shell_output("#{bin}/crnd --version")
  end
end
