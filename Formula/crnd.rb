class Crnd < Formula
  desc "Agent-first CLI for cron scheduling and process management"
  homepage "https://github.com/ysm-dev/crnd"
  license "MIT"
  version "0.0.0"

  on_macos do
    url "https://github.com/ysm-dev/crnd/releases/download/v#{version}/crnd-macos-latest.tar.gz"
    # sha256 will be updated on release
  end

  on_linux do
    url "https://github.com/ysm-dev/crnd/releases/download/v#{version}/crnd-ubuntu-latest.tar.gz"
    # sha256 will be updated on release
  end

  def install
    bin.install "crnd"
  end

  test do
    assert_match "crnd", shell_output("#{bin}/crnd --version")
  end
end
