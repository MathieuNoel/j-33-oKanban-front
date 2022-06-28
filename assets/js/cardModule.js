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