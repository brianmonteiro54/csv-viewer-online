    // E-mail fixo para CC(copia para o Denis)
    const fixedRecipient = "denis.ferro@escoladanuvem.org";
    
    // Codificação do campo CC
    const recipientsCC = encodeURIComponent(fixedRecipient);
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
    const orderList = orderText.split('\n').map(email => email.trim()).filter(email => email.length > 0);

    const tableData = {};
    document.querySelectorAll('#results-table tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        const emailCell = cells[4].querySelector('a'); // Obtém a célula do e-mail

        if (emailCell) {
            const email = decodeURIComponent(emailCell.href.split('to=')[1].split('&')[0]).trim();
            const totalScore = cells[1].innerText.trim();
            const labScore = cells[2].innerText.trim();
            const kcScore = cells[3].innerText.trim();

            if (email) {
                tableData[email] = {
                    total: totalScore,
                    lab: labScore,
                    kc: kcScore
                };
            }
        }
    });

    let orderedPerformance = '';

    orderList.forEach(email => {
        if (tableData[email]) {
            let total = tableData[email].total.replace('%', '').replace(',', '.');
            let lab = tableData[email].lab.replace('%', '').replace(',', '.');
            let kc = tableData[email].kc.replace('%', '').replace(',', '.');

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
            orderedPerformance += `Email não encontrado: ${email}\n`; // Adiciona mensagem caso não encontre o e-mail
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
});



function getGreeting() {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
        return "Bom dia";
    } else if (hours >= 12 && hours < 18) {
        return "Boa tarde";
    } else {
        return "Boa noite";
    }
}


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
                    const kcScore = row['Knowledge Checks Current Score'];
                    const kcScoreValue = kcScore ? parseFloat(kcScore.replace(',', '.')) : NaN;
                    const labScore = row['Labs Current Score'];
                    const labScoreValue = labScore ? parseFloat(labScore.replace(',', '.')) : NaN;
                    const totalScore = row['Current Score'];
                    const totalScoreValue = totalScore ? parseFloat(totalScore.replace(',', '.')) : NaN;
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
                const kcScore = row['Knowledge Checks Current Score']; // KC
                const labScore = row['Labs Current Score']; // LAB
                const totalScore = row['Current Score']; // Total
                const email = row['SIS Login ID']; // Email do aluno

                // Ajuste para "KC" e "Lab"
                const pendingKCs = Object.keys(row)
                .filter(key => 
                    key.match(/^\d+-.*-.*KC/i) ||  // Detecta qualquer formato de KC com base em "KC"
                    key.match(/^\d+-.*-.*Lab/i)||  // Detecta qualquer formato de Lab com base em "Lab"
                    key.match(/^Atividade\s*[:|]\s*.+/) // Detecta qualquer formato de Atividade
                )
                .filter(key => {
                    const value = row[key];
                    return value !== null && value !== undefined && parseFloat(value.replace(',', '.')) === 0;
                })
                .map(key => key.replace(/\s*\(\d+\)$/, '').trim()); 
            
                // Obtém a saudação correta
                const greeting = getGreeting();
                const pendingKCsStr = pendingKCs.length > 0 ? pendingKCs.join('\n') : "Nenhum! Parabéns, você concluiu todos os KCs e laboratórios disponíveis até o momento! Essa conquista reflete sua dedicação e compromisso em aproveitar ao máximo essa oportunidade. Continue estudando e revisando os conteúdos, pois o próximo grande passo está à sua frente: a certificação Cloud Practitioner! Essa certificação é uma porta de entrada para oportunidades no mercado, e você já está na direção certa. Lembre-se: todo o esforço investido agora é um investimento no seu futuro.";
                const message = `${greeting}, ${fullName}. Seu desempenho nos KCs está em ${kcScore}%, e seu desempenho nos Labs está em ${labScore}%. Você ainda tem alguns KCs/Labs pendentes:\n\n${pendingKCsStr}\n\nPara aprovação no curso AWS re/Start, os seguintes requisitos devem ser atendidos:\n\n1. Conclusão de 100% dos Laboratórios: Todos os laboratórios do curso devem ser completados com pontuação total.\n\n2. Pontuação em KCs: Obter uma pontuação mínima de 70%.\n\n3. Presença nas Aulas: Manter uma presença mínima de 80% em todas as aulas.`;
                const emailSubject = `Desempenho e Faltas - Aviso importante!! - ${fullName} - Escola da Nuvem`;
                const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}?cc=${recipientsCC}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;


                const rowElement = document.createElement('tr');
                rowElement.innerHTML = `
                    <td>${fullName}</td>
                    <td>${totalScore}</td>
                    <td>${labScore}</td>
                    <td>${kcScore}</td>
                    <td> <a href="${outlookUrl}" target="_blank" class="botao-enviar-email">Enviar E-mail</a></td>
                    <td><button class="botao-copiado" onclick="copyEmailContent('${encodeURIComponent(message)}', '${email}', '${fullName}', this)">Copiar texto</button></td>
                `;

                resultsTableBody.appendChild(rowElement);
            });
        });
}

let timeoutId;  // Variável global para armazenar o temporizador da notificação

function copyEmailContent(message, email, fullName, button) {
    if (!fullName) {
        console.error('Nome completo não fornecido!');
        return;
    }
        
    // Decodifica a mensagem
    const decodedMessage = decodeURIComponent(message);

  const textToCopy = decodeURIComponent(message); // Ajuste conforme necessário
  navigator.clipboard.writeText(textToCopy).then(function() {
    // Exibe a notificação com a animação
    showNotification();

    // Muda a cor do botão quando clicado
    button.classList.add('copiado'); // Adiciona a classe para mudar a cor do botão

  }).catch(function(err) {
    console.error('Erro ao copiar o texto: ', err);
  });

    // Codifica o assunto corretamente
    const subject = encodeURIComponent(`Desempenho e Faltas - Aviso importante!! - ${fullName} - Escola da Nuvem`);

    // Gera a URL com CC e BCC
    const manualEmailUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}?cc=${recipientsCC}&subject=${subject}`;

    // Abre a nova guia com o e-mail preenchido corretamente
    window.open(manualEmailUrl, '_blank');

}

function showNotification() {
  const notificacao = document.getElementById('notificacao');
  const barraProgresso = document.getElementById('barra-progresso');
  
  // Se a notificação já estiver visível, removemos ela antes de exibir novamente
  if (timeoutId) {
    clearTimeout(timeoutId);  // Limpa o temporizador anterior
    notificacao.classList.remove('show');  // Remove a classe 'show' para esconder
  }

  // Adiciona a classe 'show' para tornar a notificação visível
  notificacao.classList.add('show');
  
  // Reseta a animação da barra de progresso (remove a animação e adiciona de novo)
  barraProgresso.style.animation = 'none';  // Remove a animação
  // Força o navegador a processar a mudança
  void barraProgresso.offsetWidth; // Recalcula o layout
  barraProgresso.style.animation = 'progresso 10s linear forwards';  // Reaplica a animação

  // Remove a classe 'show' e esconde a notificação após 10 segundos
  timeoutId = setTimeout(function() {
    notificacao.classList.remove('show');
  }, 5000); 
}


