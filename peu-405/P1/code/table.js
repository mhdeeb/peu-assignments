class TableManager {
  constructor(columnHeaders, tableID, classID) {
    this.table = new p5.Table();
    this.tableID = tableID;
    this.classID = classID;
    this.addColumns(columnHeaders);
  }

  addColumns(columnHeaders) {
    columnHeaders.forEach((header) => this.table.addColumn(header));
  }

  insertRow(rowData) {
    let newRow = this.table.addRow();
    for (let c = 0; c < this.table.getColumnCount(); c++) {
      newRow.set(this.table.columns[c], rowData[c]);
    }
  }

  clear() {
    this.table.clearRows();
  }

  getTable() {
    return this.table;
  }

  buildHTMLTable() {
    let existingTable = document.getElementById(this.tableID);
    if (existingTable) {
      existingTable.remove();
    }

    let cc = this.table.getColumnCount();
    let rc = this.table.getRowCount();
    let rows = this.table.getRows();

    let headerHTML =
      "<tr class='theader'>" +
      this.table.columns.map((col) => `<th>${col}</th>`).join("") +
      "</tr>";

    let rowsHTML = rows
      .map((row) => {
        return (
          "<tr>" +
          this.table.columns
            .map(
              (col) =>
                `<td>${
                  Number.isInteger(row.get(col)) ||
                  typeof row.get(col) !== "number"
                    ? row.get(col)
                    : row.get(col).toFixed(3)
                }</td>`
            )
            .join("") +
          "</tr>"
        );
      })
      .join("");

    let tableElement = createElement("table", headerHTML + rowsHTML);
    tableElement.addClass(this.classID);
    tableElement.id(this.tableID);
  }
}
