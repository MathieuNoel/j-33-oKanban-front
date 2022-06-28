// module utilitaire utilisé par bon nombre d'autres modules
const utilsModule = {
    base_url: 'http://localhost:3000',
    hideModals: function() {
        // cacher les modales
        const modals = document.getElementsByClassName('modal');
        for(const modal of modals) {
          // on cache toutes les modals
          modal.classList.remove('is-active');
        }
      },
}

module.exports = utilsModule;