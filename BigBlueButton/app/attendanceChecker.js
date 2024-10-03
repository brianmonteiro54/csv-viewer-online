function checkAttendanceWithInput(groupedByInitial) {
    // Pega os nomes inseridos na textarea
    const userNamesInput = document.getElementById('alunosInput').value;

    if (userNamesInput) {
        // Processar os nomes inseridos pelo usuário
        const todosAlunos = userNamesInput.split('\n').map(aluno => normalizeName(aluno.trim()));
        const presentes = Object.values(groupedByInitial).flat().map(aluno => normalizeName(aluno));

        // Verificar quem faltou
        const faltaram = todosAlunos.filter(aluno => !presentes.includes(aluno));
        const naoListados = presentes.filter(aluno => !todosAlunos.includes(aluno));

        displayAttendanceResults(faltaram, naoListados);
    } else {
        alert('Nenhum nome foi inserido.');
    }
}

function normalizeName(name) {
    return name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function displayAttendanceResults(faltaram, naoListados) {
    const outputDiv = document.getElementById('output');
    let resultsHtml = '<div class="result-section">';
    resultsHtml += '<h2>Resultados da Verificação de Presença</h2>';

    resultsHtml += '<h3>Alunos que faltaram:</h3>';
    if (faltaram.length > 0) {
        resultsHtml += '<table>';
        resultsHtml += '<thead><tr><th>Nome</th></tr></thead><tbody>';
        faltaram.forEach(aluno => {
            resultsHtml += `<tr><td>${capitalizeWords(aluno)}</td></tr>`;
        });
        resultsHtml += '</tbody></table>';
    } else {
        resultsHtml += '<p>Todos os alunos estavam presentes.</p>';
    }

    resultsHtml += '<h3>Alunos Presentes com Nome Divergente</h3>';
    if (naoListados.length > 0) {
        resultsHtml += '<table>';
        resultsHtml += '<thead><tr><th>Nome</th></tr></thead><tbody>';
        naoListados.forEach(aluno => {
            resultsHtml += `<tr><td>${capitalizeWords(aluno)}</td></tr>`;
        });
        resultsHtml += '</tbody></table>';
    } else {
        resultsHtml += '<p>Não houve alunos não listados que participaram.</p>';
    }

    resultsHtml += '</div>';
    outputDiv.innerHTML = resultsHtml;
}

function capitalizeWords(name) {
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
