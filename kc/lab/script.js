document.getElementById('file-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        alert('Please upload a file before submitting.');
        return;
    }

    Papa.parse(file, {
        header: true,
        complete: function (results) {
            processCSV(results.data);
        }
    });
});

document.getElementById('copy-performance-btn').addEventListener('click', function () {
    document.getElementById('performance-order-container').style.display = 'block';
});

document.getElementById('copy-to-clipboard-btn').addEventListener('click', function () {
    const orderText = document.getElementById('performance-order').value.trim();
    const orderList = orderText.split('\n').map(name => name.trim()).filter(name => name.length > 0);

    const tableData = {};
    document.querySelectorAll('#results-table tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0].innerText.trim();
        const score = cells[1].innerText.trim();
        tableData[name] = score;
    });

    let orderedPerformance = '';
    orderList.forEach(name => {
        if (tableData[name]) {
            orderedPerformance += `${tableData[name]}%\n`;
        }
    });

    const textArea = document.createElement('textarea');
    textArea.value = orderedPerformance.trim();
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    alert('Desempenho copiado para a área de transferência!');
});

function processCSV(data) {
    fetch('students.json')
        .then(response => response.json())
        .then(studentsData => {
            const resultsTableBody = document.querySelector('#results-table tbody');
            const resultsDiv = document.getElementById('results');
            resultsTableBody.innerHTML = '';

            const filteredData = data
                .filter(row => {
                    const fullName = row['Student'] ? row['Student'].split(', ').reverse().join(' ').trim() : '';
                    const kcScore = row['Labs Current Score'];
                    const kcScoreValue = kcScore ? parseFloat(kcScore.replace(',', '.')) : NaN;
                    const labScore = row['Labs Current Score'];
                    const labScoreValue = labScore ? parseFloat(labScore.replace(',', '.')) : NaN;
                    return fullName && fullName !== 'Testar aluno' && !isNaN(kcScoreValue) && kcScoreValue < 101;
                })
                .sort((a, b) => {
                    const nameA = a['Student'].split(', ').reverse().join(' ').trim();
                    const nameB = b['Student'].split(', ').reverse().join(' ').trim();
                    return nameA.localeCompare(nameB);
                });

            if (filteredData.length > 0) {
                resultsDiv.style.display = 'block';
            }

            filteredData.forEach(row => {
                const fullName = row['Student'].split(', ').reverse().join(' ').trim();
                const kcScore = row['Labs Current Score']; //kc
                const labScore = row['Labs Current Score']; //lab
                const email = row['SIS Login ID']; //usar o email do aluno

                // Ajuste para "KC" e "Lab"
                const pendingKCs = Object.keys(row)
                    .filter(key => 
                        //key.match(/^\d+-\s*\[\w+\]\s*-\s*KC/) ||  // Ajuste para [JAWS] -KC e variações
                        key.match(/^\d+-\s*-\s*Lab\s?/)           // Ajuste para --Lab e variações
                    )
                    .filter(key => {
                        const value = row[key];
                        return value !== null && value !== undefined && parseFloat(value.replace(',', '.')) === 0;
                    })
                    .map(key => key.replace(/\s*\(\d+\)$/, '').trim());

                const pendingKCsStr = pendingKCs.length > 0 ? pendingKCs.join('\n') : "Nenhum";

                const message = `Boa noite, ${fullName}. 𝐬𝐞𝐮 𝐝𝐞𝐬𝐞𝐦𝐩𝐞𝐧𝐡𝐨 𝐧𝐨𝐬 𝐋𝐚𝐛𝐬 está em ${labScore}%. Você ainda tem alguns Labs pendentes:\n\n${pendingKCsStr}\n\nPara aprovação no curso AWS re/Start, os seguintes requisitos devem ser atendidos:\n\n1. 𝗖𝗼𝗻𝗰𝗹𝘂𝘀𝗮̃𝗼 𝗱𝗲 𝟭𝟬𝟬% 𝗱𝗼𝘀 𝗟𝗮𝗯𝗼𝗿𝗮𝘁𝗼́𝗿𝗶𝗼𝘀: Todos os laboratórios do curso devem ser completados com pontuação total.\n\n2. 𝑷𝒐𝒏𝒕𝒖𝒂𝒄̧𝒂̃𝒐 𝒆𝒎 𝑲𝑪'𝒔: Obter uma pontuação mínima de 70%.\n\n3. 𝗣𝗿𝗲𝘀𝗲𝗻𝗰̧𝗮 𝗻𝗮𝘀 𝗔𝘂𝗹𝗮𝘀: Manter uma presença mínima de 80% em todas as aulas.`;
                const emailSubject = `Desempenho Acadêmico - ${fullName} - Escola da Nuvem`;
                const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;

                const rowElement = document.createElement('tr');
                rowElement.innerHTML = `
                    <td>${fullName}</td>
                    <td>${labScore}</td>
                    <td><a href="${outlookUrl}" target="_blank">Enviar E-mail</a></td>
                `;

                resultsTableBody.appendChild(rowElement);
            });
        });
}
