(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./cardModule":2,"./labelModule":3,"./listModule":4,"./utilsModule":5}],2:[function(require,module,exports){
const utilsModule = require('./utilsModule');
const labelModule = require('./labelModule');

const cardModule = {
    showAddCardModal: function(event) {
        // récupérer l'id de la bonne liste
        // const idList = event.target.closest('.panel').getAttribute('data-list-id');
        // vu qu'on récupère la valeur d'un data-attribute (attribut HTML personnalisé) on peut utiliser une autre façon de faire :
        const idList = event.target.closest('.panel').dataset.listId;
        // mettre à jour l'input hidden du formulaire de la modale
        document.querySelector('#addCardModal input[name="list_id"]').value = idList;
        // afficher la modale de carte
        document.getElementById('addCardModal').classList.add('is-active');
    },
    handleAddCardForm: async function(event) {
        // empêcher le rechargement de la page
        event.preventDefault();
        // récupérer les infos du formulaire
        const formData = new FormData(event.target);
        // faire un call API en POST sur /cards
        const response = await fetch(`${utilsModule.base_url}/cards`, {
          method: 'POST',
          body: formData
        });
        // on récupère la nouvelle carte
        const newCard = await response.json();
    
        // créer la carte dans le DOM
        cardModule.makeCardInDOM(newCard);
        // reset les champs du formulaire
        event.target.reset();
        // cacher la modale
        utilsModule.hideModals();
      },
      makeCardInDOM: function(card) {
        // récupérer le template de card
        const template = document.getElementById('templateCard');
        // cloner le template
        const cloneTemplate = document.importNode(template.content, true);
        // modifie l'identifiant de la carte dans le DOM
        const cardDOM = cloneTemplate.querySelector('.box');
        cardDOM.dataset.cardId = card.id;
        // modifier le titre de la carte
        cloneTemplate.querySelector('.column').textContent = card.title;
        // modifier sa couleur de fond
        cardDOM.style.backgroundColor = card.color;
        // ajouter un écouteur d'event click sur le bouton pour modifier une carte
        cardDOM.querySelector('.edit-card-icon').addEventListener('click', cardModule.showEditCardForm);
        // ajouter un écouteur d'event click sur le bouton de suppression de carte
        cardDOM.querySelector('.delete-card-icon').addEventListener('click', cardModule.deleteCard);
        // ajouter un écouteur d'event submit sur le formulaire d'édition pour modifier une carte
        const editForm = cardDOM.querySelector('.edit-card-form');
        editForm.addEventListener('submit', cardModule.handleEditCardForm);
        // ajouter un écouteur d'évènement click sur le bouton d'association de tag pour ouvrir la modale
        cardDOM.querySelector('.associate-tag-icon').addEventListener('click', labelModule.showAssociateTagToCardModal);
        // modifie l'id du formulaire d'édition
        editForm.querySelector('input[name="card-id"]').value = card.id;
        // insérer le clone du template dans la bonne liste du DOM
        const listDOM = document.querySelector(`.panel[data-list-id="${card.list_id}"]`);
        // on insère la carte dans le block container de list
        listDOM.querySelector('.panel-block').appendChild(cloneTemplate);
      },
      showEditCardForm: function(event) {
        const cardDOM = event.target.closest('.box');
        // on cache le titre de la carte
        cardDOM.querySelector('.card-title').classList.add('is-hidden');
        // on affiche le formulaire d'édition
        cardDOM.querySelector('.edit-card-form').classList.remove('is-hidden');
      },
      handleEditCardForm: async function(event) {
        // empêcher le rechargement de la page
        event.preventDefault();
        // récupérer les infos du formulaire
        const formData = new FormData(event.target);
        // faire un call API en PATCH sur /cards/:id
        const titleCardDOM = event.target.previousElementSibling;
        try {
          const response = await fetch(`${utilsModule.base_url}/cards/${formData.get('card-id')}`, {
            method: 'PATCH',
            body: formData
          });
          // on récupère la data (la carte modifiée ou l'erreur)
          const json = await response.json();
          // en cas de code non succès renvoie dans le catch l'erreur
          if(!response.ok) throw json;
          // modifier le titre de la carte dans le DOM
          titleCardDOM.textContent = json.title;
          // modifier la couleur de la carte dans le DOM
          event.target.closest('.box').style.backgroundColor = json.color;
        } catch(error) {
          alert('Impossible de modifier la carte !');
          console.error(error);
        }
        // cacher le formulaire
        event.target.classList.add('is-hidden');
        // et réafficher le titre
        titleCardDOM.classList.remove('is-hidden');
      },
      deleteCard: async function(event) {
        // récupérer l'identifiant de la carte
        const cardDOM = event.target.closest('.box');
        // faire un call API en DELETE sur /cards/:id
        try {
          const response = await fetch(`${utilsModule.base_url}/cards/${cardDOM.dataset.cardId}`, {
            method: 'DELETE'
          });
          // récupérer la data (un msg de succès ou d'erreur)
          const json = await response.json();
          // si on a un code d'erreur rejette dans le catch l'erreur
          if(!response.ok) throw json;
          // supprimer la carte du DOM
          cardDOM.remove();
        } catch(error) {
          alert('Impossible de supprimer cette carte !');
          console.error(error);
        }
      },
      dragCard: function(event) {
        // on va modifier la position de toutes les cartes dans la liste d'origine
        const originList = event.from;
        // récupérer l'id de la liste
        let listId = originList.closest('.panel').dataset.listId;
        // on veut récupérer toutes les cartes
        let cardsDOM = originList.querySelectorAll('.box');
        // on modifie les infos des cartes de la liste d'origine
        cardModule.updateAllCards(cardsDOM, listId);
        // on teste voir si nos deux listes sont similaires, dans ce cas inutile d'executer le code du dessous
        if(originList === event.to) return;
        // on récupère la nouvelle liste
        const newList = event.to;
        // on réaffecte de nouvelles cartes à notre variable cardsDOM
        cardsDOM = newList.querySelectorAll('.box');
        // modifier l'id de liste
        listId = newList.closest('.panel').dataset.listId
        // on modifie les infos des cartes de la nouvelle liste
        cardModule.updateAllCards(cardsDOM, listId);
      },
      updateAllCards: function(cardsDOM, listId) {
        cardsDOM.forEach(async (cardDOM, index) => {
         
          const formData = new FormData();
          // vu que formData n'a aucune information, on va lui passer manuellement l'info de la position avec la méthode set
          formData.set('position', index);
          formData.set('list_id', listId);

          // const dataCard = {
          //   id: cardDOM.dataset.cardID,
          //   position: index
          // }

          try {
            // faire un call API en PATCH sur /cards/:id
            const response = await fetch(`${utilsModule.base_url}/cards/${cardDOM.dataset.cardId}`, {
              // headers: {
              //   'Accept': 'application/json',
              //   'Content-Type': 'application/json'
              // },
              method: 'PATCH',
              // on envoie la data qu'on veut modifier au format JSON
              body: formData
            });
            const json = await response.json();
            if(!response.ok) throw json;
          } catch(error) {
            alert('Impossible de déplacer la carte !');
            console.error(error);
          }
          
        });
      }
}

module.exports = cardModule;
},{"./labelModule":3,"./utilsModule":5}],3:[function(require,module,exports){
const utilsModule = require('./utilsModule');

const labelModule = {
    makeLabelInDOM: function(label) {
        // pas besoin de template car un label est ici un simple span
        console.log(label);
        // créer la balise span
        const labelDOM = document.createElement('span');
        // modifier le texte du span
        labelDOM.textContent = label.title;
        // modifier la couleur du label
        labelDOM.style.backgroundColor = label.color;
        // on va lui mettre un id (data-label-id)
        labelDOM.dataset.labelId = label.id;
        // on va lui donner la class tag de bulma
        labelDOM.classList.add('tag');
        // on va d'abord récupérer la bonne carte
        const cardDOM = document.querySelector(`.box[data-card-id="${label.card_has_label.card_id}"]`);
        // attacher un écouteur d'évènement dblclick au label pour pouvoir le dissocier de sa carte
        labelDOM.addEventListener('dblclick', labelModule.dissociateTagFromCard);
        // insérer le tag dans la bonne carte
        cardDOM.querySelector('.tags').appendChild(labelDOM);
    },
    dissociateTagFromCard: async function(event) {
        // récupérer l'id de la carte
        const cardId = event.target.closest('.box').dataset.cardId;
        // récupérer l'id du label
        const labelId = event.target.dataset.labelId;
        // faire un call API en DELETE sur /cards/:card_id/label/:label_id pour dissocier un tag de sa carte
        try {
            const response = await fetch(`${utilsModule.base_url}/cards/${cardId}/label/${labelId}`, {
                method: 'DELETE'
            });
            const json = await response.json();

            if(!response.ok) throw json;

            // enlever le tag de la carte dans le DOM
            event.target.remove();
        } catch(error) {
            alert('Impossible de dissocier le tag de sa carte !');
            console.error(error);
        }
    },
    showAssociateTagToCardModal: async function(event) {
        // afficher la modale pour associer un tag à une carte
        const modal = document.querySelector('#addTagToCardModal');
        modal.classList.add('is-active');
        const cardDOM = event.target.closest('.box');
        // mettre à jour l'input card_id du formulaire de la modal
        modal.querySelector('input[name="card_id"]').value = cardDOM.dataset.cardId;
        // récupérer tous les labels disponibles
        try {
            const response = await fetch(`${utilsModule.base_url}/labels`);
            const json = await response.json();

            if(!response.ok) throw json;

            // remplir le select avec les tags que la carte ne possède pas encore
            // avant ça on va récupérer tous les tags de la carte dans le DOM
            const labelsDOM = cardDOM.querySelectorAll('.tag');
            
            // on récupère le select de la modale dans le DOM
            const selectDOM = modal.querySelector('select[name="tags"]');
            // on le vide
            selectDOM.textContent = '';
            for(const label of json) {
                // on va rechercher dans les tags récupérés de la carte le tag actuel
                // const tagInCard = labelsDOM.find(lblDOM => lblDOM.textContent === label.title);
                // si le tag est déjà sur la carte alors inutile de créer la balise option, on passe au tour de boucle suivant
                // if(tagInCard) continue;
                // créer une balise option dans le select
                const option = document.createElement('option');
                // remplir la balise option avec la bonne value
                option.value = label.id;
                // remplir la balise option avec le nom du label
                option.textContent = label.title;
                // insérer la balise dans le select
                selectDOM.appendChild(option);
            }
        } catch(error) {
            alert('Impossible de récupérer les labels !');
            console.error(error);
        }
    },
    handleAssociateLabelForm: async function(event) {
        // empêcher le rechargement de la page
        event.preventDefault();
        // récupérer les infos du form
        const formData = new FormData(event.target);
        // récupérer l'id de la carte
        // récupérer l'id du label
        try {
            // faire un call API en POST sur /cards/:card_id/label/:label_id pour associer un label à une carte
            const response = await fetch(`${utilsModule.base_url}/cards/${formData.get('card_id')}/label/${formData.get('tags')}`, {
                method: 'POST'
            });
            const json = await response.json();

            if(!response.ok) throw json;

            // on va chercher le bon tag dans ce qu'on a récupéré
            const tag = json.labels.find(tag => tag.id === Number(formData.get('tags')));

            // ajouter le tag à la carte dans le DOM
            labelModule.makeLabelInDOM(tag);

            // on ferme la modale
            utilsModule.hideModals();

        } catch(error) {
            alert('Impossible d\'associer un tag à sa carte !');
            console.error(error);
        }
        
    }
}

module.exports = labelModule;
},{"./utilsModule":5}],4:[function(require,module,exports){
const utilsModule = require('./utilsModule');
const cardModule = require('./cardModule');

const listModule = {
    showAddListModal: function() {
        // afficher la modale à l'écran
        document.getElementById('addListModal').classList.add('is-active');
    },
    handleAddListForm: async function(event) {
        // il faut empêcher le comportement par défaut de l'event submit, à savoir l'envoi d'une requête HTTP et donc le rechargement de la page
        event.preventDefault();
        // récupérer les infos du formulaire
        const formData = new FormData(event.target);
        try {
          // on fait un call API en POST sur /lists
          const response = await fetch(`${utilsModule.base_url}/lists`, {
            method: 'POST',
            body: formData
          });
          const newList = await response.json();
          // faire apparaitre une nouvelle liste dans le DOM
          listModule.makeListInDOM(newList);
        } catch(error) {
          console.error(error);
          alert('Impossible d\'ajouter une liste !');
        }
        
        // reset les champs du formulaire
        event.target.reset();
        // cacher la modale
        utilsModule.hideModals();
      },
      makeListInDOM: function(list) {
        // créer une nouvelle liste dans le DOM
        // récupérer le template
        const template = document.getElementById('templateList');
        // en faire un clone
        const cloneTemplate = document.importNode(template.content, true);
        // modifier son data attribute id
        cloneTemplate.querySelector('.panel').dataset.listId = list.id;
        // modifier l'id du input hidden du formulaire d'édition
        const editForm = cloneTemplate.querySelector('.edit-list-form');
        editForm.querySelector('input[name="list-id"]').value = list.id;
        // le modifier (nom de la liste)
        const h2 =  cloneTemplate.querySelector('h2');
        h2.textContent = list.name;
        // ajouter un écouteur d'event sur le titre de liste pour afficher le formulaire d'édition
        h2.addEventListener('dblclick', listModule.showEditListForm);
        // ajouter un écouteur d'event sur le formulaire d'édition pour pouvoir modifier le nom de la liste
        editForm.addEventListener('submit', listModule.handleEditListForm);
        // ajouter un écouteur d'event sur le bouton + pour afficher la modale de carte
        cloneTemplate.querySelector('.add-list-icon').addEventListener('click', cardModule.showAddCardModal);
        // ajouter un écouteur d'event sur le bouton poubelle pour supprimer la liste
        cloneTemplate.querySelector('.delete-list-icon').addEventListener('click', listModule.deleteList);
        // Drag & Drop des cartes au sein de la liste
        // on va chopper l'élément qui va contenir nos cartes, ici la div panel-block
        const cardContainer = cloneTemplate.querySelector('.panel-block');
        new Sortable(cardContainer, {
          group: 'list',
          draggable: '.box', // on lui renseigne ce qu'on veut déplacer, à savoir les cartes
          onEnd: cardModule.dragCard
        });
        // insérer dans la page concrètement
        document.querySelector('.card-lists').appendChild(cloneTemplate);
      },
      showEditListForm: function(event) {
        // cacher le h2
        event.target.classList.add('is-hidden');
        // afficher le formulaire d'édition
        event.target.nextElementSibling.classList.remove('is-hidden');
      },
      handleEditListForm: async function(event) {
        // empêcher le rechargement de la page
        event.preventDefault();
        // récupérer les infos du formulaire
        const formData = new FormData(event.target);
        const h2 = event.target.previousElementSibling;
        // faire un call API en PATCH sur /lists/:id
        try {
          const response = await fetch(`${utilsModule.base_url}/lists/${formData.get('list-id')}`, {
            method: 'PATCH',
            body: formData
          });
          // ici on récupère la data (la liste modifiée ou l'erreur)
          const json = await response.json();
          // si on a un code d'erreur on renvoie dans le catch
          if(!response.ok) throw json;
          // modifie le h2 dans le DOM (eh oui ça ne se fait pas tout seul !)
          h2.textContent = json.name;
        } catch(error) {
          alert('Impossible de modifier la liste !');
          console.error(error);
        }
        // on réaffiche le titre
        h2.classList.remove('is-hidden');
        // puis on masque le formulaire
        event.target.classList.add('is-hidden');
      },
      deleteList: async function(event) {
        // si l'utilisateur refuse de supprimer la liste sort de la fonction
        if(!confirm('Voulez-vous vraiment supprimer cette liste ?')) return;
        // récupérer la liste dans le DOM
        const listDOM = event.target.closest('.panel');
        // faire un call API en DELETE sur /lists/:id
        try {
          const response = await fetch(`${utilsModule.base_url}/lists/${listDOM.dataset.listId}`, {
            method: 'DELETE'
          });
          const json = await response.json();
          if(!response.ok) throw json;
          // supprimer la liste dans le DOM
          listDOM.remove();
        } catch(error) {
          alert('Impossible de supprimer la liste !');
          console.error(error);
        }
      },
      dragList: function(event) {
        // récupérer les listes dans un tableau
        const listsDOM = document.querySelectorAll('.panel');
        listsDOM.forEach(async (listDOM, index) => {
          // on créé un formData
          const formData = new FormData();
          // et on le rempli avec la position de la liste
          formData.set('position', index);
          // faire un call API en PATCH sur /lists/:id
          const response = await fetch(`${utilsModule.base_url}/lists/${listDOM.dataset.listId}`, {
            method: 'PATCH',
            body: formData
          });
        });
      }
}

module.exports = listModule;
},{"./cardModule":2,"./utilsModule":5}],5:[function(require,module,exports){
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
},{}]},{},[1]);
