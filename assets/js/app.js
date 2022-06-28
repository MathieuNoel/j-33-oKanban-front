const utilsModule = require('./utilsModule');
const labelModule = require('./labelModule');
const cardModule = require('./cardModule');
const listModule = require('./listModule');

// on objet qui contient des fonctions
var app = {
  // fonction d'initialisation, lancée au chargement de la page
  init: function () {
    app.getListsFromAPI();
    app.addListenerToActions();
  },
  addListenerToActions: function() {
    // mettre un écouteur d'évènement clic sur le bouton d'ajout de liste
    document.getElementById('addListButton').addEventListener('click', listModule.showAddListModal);
    // ajouter un écouteur d'évènement click sur les boutons de fermeture de modale
    const btnsCloseModal = document.getElementsByClassName('close');
    // const btnsCloseModal = document.querySelectorAll('.close');
    for(const btnClose of btnsCloseModal) {
      // pour chaque bouton close on déclencher la fonction hideModals
      btnClose.addEventListener('click', utilsModule.hideModals);
    }
    // ajouter un écouteur d'event submit sur le formulaire d'ajout de liste
    document.querySelector('#addListModal form').addEventListener('submit', listModule.handleAddListForm);
    // ajouter un écouteur d'event click sur les boutons +
    // const btnsAddCard = document.querySelectorAll('.panel a.is-pulled-right');
    // for(const btnAddCard of btnsAddCard) {
    //   btnAddCard.addEventListener('click', app.showAddCardModal);
    // }
    // ajouter un écouteur d'évènement submit sur le formulaire d'ajout de carte
    document.querySelector('#addCardModal form').addEventListener('submit', cardModule.handleAddCardForm);
    // on va attacher un écouteur d'event submit sur le formulaire d'association d'un tag sur une carte
    document.querySelector('#addTagToCardModal form').addEventListener('submit', labelModule.handleAssociateLabelForm);
  },
  // récupérer les listes depuis l'API et les afficher dans le DOM
  getListsFromAPI: async function() {
    try {
      // on fait un call API en GET sur /lists pour récupérer l'objet response avec nos listes
      const response = await fetch(`${utilsModule.base_url}/lists`);
      // on appelle la méthode json sur l'objet response obtenu pour récupérer directement notre tableau de listes (la data)
      const lists = await response.json();

      console.log(lists);
      
      // dessiner les listes dans le DOM
      for(const list of lists) {
        listModule.makeListInDOM(list);
        for(const card of list.cards) {
          cardModule.makeCardInDOM(card);
          for(const label of card.labels) {
            // dessiner les tag dans la carte du DOM
            labelModule.makeLabelInDOM(label);
          }
        }
      }

      // Drag & drop des listes
      // on récupère le container de nos listes, à savoir card-lists
      const listContainer = document.querySelector('.card-lists');
      new Sortable(listContainer, {
        // vu qu'il n'y a qu'un seul container pas besoin de group
        // on renseigne directement les éléments déplacable dans draggable, ici nos listes (.panel)
        draggable: '.panel',
        onEnd: listModule.dragList
      });
    } catch(error) {
      console.error(error);
      alert('Impossible de récupérer les listes !');
    }
  }
};
// on accroche un écouteur d'évènement sur le document : quand le chargement est terminé, on lance app.init
document.addEventListener('DOMContentLoaded', app.init );