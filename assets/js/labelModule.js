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