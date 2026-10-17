var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const files = input?.files;
  if (!Array.isArray(files) || files.length < 1 || files.length > 10)
    throw Error("\u8BF7\u660E\u786E\u9009\u62E91\u201310\u4EFD\u7B80\u5386\u6216\u9879\u76EE\u8D44\u6599");
  for (const name of files)
    if (typeof name !== "string" || !name.trim() || name.length > 1e3 || /^[A-Za-z]:/.test(name) || /[\\\0]/.test(name) || name.split("/").some((s) => !s || s === "." || s === ".."))
      throw Error("\u8D44\u6599\u6587\u4EF6\u540D\u987B\u4E3A\u5B89\u5168\u7684\u76F8\u5BF9\u8DEF\u5F84\uFF0C\u4E0D\u81EA\u52A8\u4FEE\u526A\u6216\u66FF\u6362");
  if (new Set(files).size !== files.length) throw Error("\u8D44\u6599\u6E05\u5355\u5B58\u5728\u91CD\u590D\u6587\u4EF6\uFF0C\u8BF7\u5148\u79FB\u9664\u91CD\u590D\u9879");
  return { files: [...files] };
};
export {
  stdin_default as default
};
