window.addEventListener('josaaHighlight', (e) => {
  const minRank = parseInt(e.detail.minRank);
  const maxRank = parseInt(e.detail.maxRank);
  const userCategory = e.detail.category.trim().toUpperCase();
  const userQuota = e.detail.quota.trim().toUpperCase();
  const userGender = e.detail.gender.trim().toUpperCase();

  // Optional: Smooth highlight animation for rows
  const style = document.createElement('style');
  style.textContent = `tr { transition: background-color 0.5s; }`;
  document.head.appendChild(style);

  document.querySelectorAll('table tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
      let quota = cells[2]?.innerText.trim().toUpperCase().replace(/\s+/g, '');
      const category = cells[3]?.innerText.trim().toUpperCase();
      const gender = cells[4]?.innerText.trim().toUpperCase();
      const closingRank = parseInt(cells[6]?.innerText.replace(/,/g, ''));

      // Quota matching logic
      let quotaMatch = false;
      if (userQuota === '--SELECT--') {
        quotaMatch = true;
      } else if (userQuota === 'AI/OS') {
        quotaMatch = (quota === 'AI' || quota === 'OS');
      } else if (userQuota === 'HS') {
        quotaMatch = (quota === 'HS');
      }

      const rankMatch = !isNaN(closingRank) && closingRank >= minRank && closingRank <= maxRank;
      const categoryMatch = (userCategory === '--SELECT--' || category === userCategory);
      const genderMatch = (userGender === '--SELECT--' || gender === userGender);

      if (rankMatch && categoryMatch && quotaMatch && genderMatch) {
        row.style.backgroundColor = "#ffe066";
        row.style.color = "#22223b";
      } else {
        row.style.backgroundColor = "";
        row.style.color = "";
      }
    }
  });
});