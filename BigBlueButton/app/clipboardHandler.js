// app/clipboardHandler.js
function copyNamesToClipboard(groupedByInitial) {
    const allNames = Object.values(groupedByInitial).flat().join('\n');
    navigator.clipboard.writeText(allNames).then(() => {
        alert('Nomes copiados para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar nomes: ', err);
    });
}
