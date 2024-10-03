function displayData(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Limpa os dados anteriores
    let tableHtml = '<table>'; // Iniciar tabela
    tableHtml += `<thead><tr><th>Inicial</th><th>Nomes 
    <button id="copyButton" class="tooltip">&#x1f4cb;<span class="tooltiptext">Copiar</span></button>
    <button id="checkAttendanceButton" class="tooltip">&#x1f441;<span class="tooltiptext">Identificar quem faltou</span></button></th></tr></thead><tbody>`; // Add check attendance button to header

    Object.keys(groupedByInitial).sort().forEach(initial => {
        tableHtml += `<tr><td>${initial}</td><td>${groupedByInitial[initial].join('<br>')}</td></tr>`; // Add names in the same cell
    });

    tableHtml += '</tbody></table>'; // Finalizar tabela
    outputDiv.innerHTML = tableHtml; // Insira a tabela na página

    // Configura a funcionalidade do botão de cópia
    document.getElementById('copyButton').addEventListener('click', function() {
        copyNamesToClipboard(groupedByInitial);
    });

    // Exibe a caixa de texto para inserir nomes manualmente
    document.getElementById('checkAttendanceButton').addEventListener('click', function() {
        createTextareaForInput(groupedByInitial); // Chama a função para criar a caixa de texto e o botão
    });
}

function createTextareaForInput(groupedByInitial) {
    const outputDiv = document.getElementById('output');
    
    // Insere a caixa de texto no topo, antes de outros elementos
    outputDiv.innerHTML = `
        <div id="textarea-container" style="margin-top: 20px;">
            <h3>Inserir a ordem dos nomes aqui, um embaixo do outro:</h3>
            <textarea id="alunosInput" rows="10" cols="50"></textarea><br>
            <button id="verificarPresencaButton">Verificar Presença</button>
        </div>
    ` + outputDiv.innerHTML; // Adiciona o conteúdo existente após a textarea

    // Configura a funcionalidade do botão "Verificar Presença"
    document.getElementById('verificarPresencaButton').addEventListener('click', function() {
        checkAttendanceWithInput(groupedByInitial); // Chama a função de verificação
    });
}
