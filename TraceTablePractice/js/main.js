// Start-up.
// ======================================================
// INITIALIZATION
// ======================================================
window.addEventListener('DOMContentLoaded', () => {
  initProgress();
  document.querySelectorAll('[data-code-language]').forEach(button => {
     const active = button.dataset.codeLanguage === currentCodeLanguage;
     button.classList.toggle('active', active);
     button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.querySelectorAll('[data-practice-mode]').forEach(button => {
     const active = button.dataset.practiceMode === currentPracticeMode;
     button.classList.toggle('active', active);
     button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.querySelectorAll('.check-btn').forEach(button => {
     button.textContent = currentPracticeMode === 'code' ? 'Check Code' : 'Check Answers';
  });
  syncSupportModeButton();

  pracData.forEach((data, i) => renderPracEntry(`prac${i}`, data));

  saveProgress();

  resetGeneratedPractice();
  resetWalk();
  initEmbed();
});
