document.getElementById('downloadPDFBtn').addEventListener('click', async () => {
  const minRank = document.getElementById('minRank').value;
  const maxRank = document.getElementById('maxRank').value;
  const category = document.getElementById('category').value;
  const quota = document.getElementById('quota').value;
  const gender = document.getElementById('gender').value;

  // Build a readable criteria string
  let criteriaParts = [];
  if (category && category !== '--Select--') criteriaParts.push(category);
  if (quota && quota !== '--Select--') criteriaParts.push(quota);
  if (gender && gender !== '--Select--') criteriaParts.push(gender);
  if (minRank && maxRank) {
    criteriaParts.push(`Rank ${minRank}-${maxRank}`);
  } else if (minRank) {
    criteriaParts.push(`Rank ≥ ${minRank}`);
  } else if (maxRank) {
    criteriaParts.push(`Rank ≤ ${maxRank}`);
  }
  const criteriaText = criteriaParts.length
    ? `These are seats for criteria: ${criteriaParts.join(', ')}`
    : 'All seats';

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (minRank, maxRank, category, quota, gender) => {
        const minR = parseInt(minRank);
        const maxR = parseInt(maxRank);
        const userCategory = category.trim().toUpperCase();
        const userQuota = quota.trim().toUpperCase();
        const userGender = gender.trim().toUpperCase();

        let data = [];
        let headers = [];
        const table = document.querySelector('table');
        if (table) {
          headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
        }

        document.querySelectorAll('table tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            let quotaCell = cells[2]?.innerText.trim().toUpperCase().replace(/\s+/g, '');
            const categoryCell = cells[3]?.innerText.trim().toUpperCase();
            const genderCell = cells[4]?.innerText.trim().toUpperCase();
            const closingRank = parseInt(cells[6]?.innerText.replace(/,/g, ''));

            let quotaMatch = false;
            if (userQuota === '--SELECT--') {
              quotaMatch = true;
            } else if (userQuota === 'AI/OS') {
              quotaMatch = (quotaCell === 'AI' || quotaCell === 'OS');
            } else if (userQuota === 'HS') {
              quotaMatch = (quotaCell === 'HS');
            }

            const rankMatch = !isNaN(closingRank) && closingRank >= minR && closingRank <= maxR;
            const categoryMatch = (userCategory === '--SELECT--' || categoryCell === userCategory);
            const genderMatch = (userGender === '--SELECT--' || genderCell === userGender);

            if (rankMatch && categoryMatch && quotaMatch && genderMatch) {
              data.push(Array.from(cells).map(td => td.innerText.trim()));
            }
          }
        });

        // Sort by Closing Rank (ascending, column 6)
        data.sort((a, b) => {
          const rankA = parseInt(a[6].replace(/,/g, '')) || 0;
          const rankB = parseInt(b[6].replace(/,/g, '')) || 0;
          return rankA - rankB;
        });

        // Send the filtered data and headers back to the extension
        return { headers, data };
      },
      args: [minRank, maxRank, category, quota, gender]
    }, (injectionResults) => {
      const result = injectionResults[0]?.result;
      if (!result || !result.data.length) {
        alert("No data found to export!");
        return;
      }

      // Use jsPDF and autoTable to generate the PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Add the dynamic heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(criteriaText, 20, 25);

      // Table below the heading
      doc.autoTable({
        head: [result.headers],
        body: result.data,
        startY: 40, // leave space for heading
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }, // blue header
        bodyStyles: { textColor: 20 },
        alternateRowStyles: { fillColor: [240, 248, 255] }, // subtle alternate rows
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
        margin: { top: 20 }
      });
      doc.save('filtered_seats.pdf');
    });
  });
});

// Highlight logic (unchanged, uses event dispatch)
document.getElementById('highlightBtn').addEventListener('click', async () => {
  const minRank = document.getElementById('minRank').value;
  const maxRank = document.getElementById('maxRank').value;
  const category = document.getElementById('category').value;
  const quota = document.getElementById('quota').value;
  const gender = document.getElementById('gender').value;

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: (minRank, maxRank, category, quota, gender) => {
        window.dispatchEvent(new CustomEvent('josaaHighlight', {
          detail: {minRank, maxRank, category, quota, gender}
        }));
      },
      args: [minRank, maxRank, category, quota, gender]
    });
  });
});
