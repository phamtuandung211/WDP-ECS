export const handleUpload = (file) => {
  if (!file) return null;
  const url = file.path || (file.filename ? "/uploads/" + file.filename : "");
  return {
    url,
    filename: file.filename,
    format: file.format,
    resource_type: file.resource_type,
  };
};
