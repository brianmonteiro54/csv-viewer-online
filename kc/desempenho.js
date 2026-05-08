document.getElementById('copy-to-clipboard-btn').addEventListener('click', function () {
    console.log('Botão "Copiar para Área de Transferência" clicado');

    const orderText = document.getElementById('performance-order').value.trim();
    const orderList = orderText.split('\n').map(email => email.trim().toLowerCase()).filter(email => email.length > 0);

    const tableData = {};

    // Preencher a tabelaData com os dados do CSV
    csvData.forEach(row => {
        const email = row['SIS Login ID'] ? row['SIS Login ID'].trim().toLowerCase() : ''; // Converter para minúsculas
        const totalScore = row['desempenho_das_entregas']; // Total
        const labScore = row['Labs Current Score']; // LAB
        const kcScore = row['Knowledge Checks Current Score']; // KC

        if (email) {
            tableData[email] = {
                total: totalScore,
                lab: labScore,
                kc: kcScore
            };
        }
    });

    let orderedPerformance = '';

    orderList.forEach(email => {
        // Encontrar o e-mail no objeto, comparando em minúsculas
        const matchingKey = Object.keys(tableData).find(key => key.toLowerCase() === email);

        if (matchingKey) {
            let total = tableData[matchingKey].total.replace('%', '').replace(',', '.');
            let lab = tableData[matchingKey].lab.replace('%', '').replace(',', '.');
            let kc = tableData[matchingKey].kc.replace('%', '').replace(',', '.');

            total = parseFloat(total);
            lab = parseFloat(lab);
            kc = parseFloat(kc);

            if (!isNaN(total) && !isNaN(lab) && !isNaN(kc)) {
                const totalFormatted = total.toFixed(1).replace('.', ',') + '%';
                const labFormatted = lab.toFixed(1).replace('.', ',') + '%';
                const kcFormatted = kc.toFixed(1).replace('.', ',') + '%';

                orderedPerformance += `${totalFormatted}\t${labFormatted}\t${kcFormatted}\n`;
            }
        } else {
            orderedPerformance += `Email não encontrado: ${email}\n`; // Caso não encontre
        }
    });

    orderedPerformance = orderedPerformance.trim();

    if (orderedPerformance) {
        const textArea = document.createElement('textarea');
        textArea.value = orderedPerformance;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Desempenho copiado para a área de transferência!');
    } else {
        alert('Nenhum desempenho encontrado para os e-mails inseridos.');
    }

    // Depois de copiar, recarregar a tabela de resultados
    loadResults();
});


// Função que carrega os resultados novamente
function loadResults() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block'; // Exibir a tabela novamente
    const resultsTableBody = document.querySelector('#results-table tbody');
    resultsTableBody.innerHTML = ''; // Limpar a tabela existente

    // Reprocessar o CSV para preencher a tabela com os dados
    processCSV(csvData);
}
