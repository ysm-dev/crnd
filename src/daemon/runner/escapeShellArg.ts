/**
 * Escapes a string for safe use as a shell argument.
 * Wraps the argument in single quotes and escapes any embedded single quotes.
 */
export default function escapeShellArg(arg: string): string {
  // Wrap in single quotes and escape any embedded single quotes
  // 'foo'bar' becomes 'foo'\''bar'
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
