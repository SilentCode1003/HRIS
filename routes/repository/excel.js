const XLSX = require("xlsx");

exports.GenerateExcel = (sheetname, data) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: Object.keys(data[0]),
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetname);

  const columnCount = XLSX.utils.decode_range(worksheet["!ref"]).e.c + 1;

  worksheet["!cols"] = [];

  for (let i = 0; i < columnCount; i++) {
    if (i === 0) {
      worksheet["!cols"].push({ wch: 30 });
    } else {
      worksheet["!cols"].push({ wch: 20 });
    }
  }

  const excelBuffer = XLSX.write(workbook, { type: "buffer" });

  return excelBuffer;
};
