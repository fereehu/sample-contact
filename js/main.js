var App = angular.module('App', ['ngAnimate']);

//Filter for contacts, but still not working :(
App.filter('filterContacts', function () {
    return function (letterObjects, filterName) {
        var ret = [];
        //Loop through the letters
        for (var i = 0; i < letterObjects.length; i++) {
            //Loop through the contacts
            for (var j = 0; j < letterObjects[i].contacts.length; j++) {
                if (letterObjects[i].contacts[j].name.indexOf(filterName) !== -1) {
                    //If the letter contains any contact that has the filter text in its name
                    ret.push(letterObjects);
                    break;
                }
            }
        }
        return ret;
    };
});
App.factory('AppFactory', ['$http', '$log', function ($http, $log) {
        //Get the contacts.json
        this.getlist = function () {
            return $http.get('contacts.json')
                    .success(function (res) {
                        //$log.info(res);//I get the correct items, all seems ok here
                        $log.info("CONTACTS_LOADED");
                        return res;
                    })
                    .error(function () {
                        $log.error("CONTACTS_NOT_LOADED");
                    });
        };
        return this;
    }]);


var res = {};
//Service for the functions
App.service('ContactService', ['$filter', function ($filter) {
        //Get the max ID in the contact list
        this.getMaxId = function (contacts) {
            var maxId = contacts[0].Id;
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].id > maxId) {
                    maxId = contacts[i].id;
                }
            }
            return maxId;
        };
        //Comparing method for contact sorting
        this.contactNameComparing = function (first, second) {
            var nameA = first.name.toUpperCase(); // ignore upper and lowercase
            var nameB = second.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            // names must be equal
            return 0;
        };
        //Comparing method for letter sorting
        this.letterComparing = function (first, second) {
            var letterA = first.letter.toUpperCase(); // ignore upper and lowercase
            var letterB = second.letter.toUpperCase(); // ignore upper and lowercase
            if (letterA < letterB) {
                return -1;
            }
            if (letterA > letterB) {
                return 1;
            }
            // names must be equal
            return 0;
        };
        //Making the letters array from the json data
        this.createLetters = function (res) {
            //Define the variables
            var letters = [], firstLetter,
                    sortedData = res.data.sort(this.contactNameComparing),
                    currentLetter, letterObj;

            //Looping over the res.data
            for (var i = 0; i < sortedData.length; i++) {
                //Getting the first letter of the contacts name
                firstLetter = sortedData[i].name[0];

                //If we need to add a new letter object to the letters array
                if (!currentLetter || currentLetter !== firstLetter) {
                    currentLetter = firstLetter;
                    letterObj = {
                        letter: currentLetter,
                        contacts: []
                    };
                    letters.push(letterObj);
                }

                //Add contacts to the letter
                letterObj.contacts.push(sortedData[i]);
                //Sort the contacts
                letterObj.contacts.sort(this.contactNameComparing);
            }

            return letters;
        };
        //Add a new contact function
        this.addContact = function (newContact, letters) {
            var firstLetter,
                    letterObject;

            firstLetter = $filter('uppercase')(newContact.name[0]); //Getting the first letter of the contact

            //Is there a letter object with the first letter
            for (var i = 0; i < letters.length; i++) {
                if (letters[i].letter === firstLetter) {
                    letterObject = letters[i];
                    break;
                }
            }

            //Make a new letter object
            if (typeof letterObject === "undefined") {
                letterObject = {
                    letter: firstLetter,
                    contacts: []
                };

                //Add letter and sorting
                letters.push(letterObject);
                letters.sort(this.letterComparing);
            }

            //Add contact and sorting
            letterObject.contacts.push(newContact);
            letterObject.contacts.sort(this.contactNameComparing);
        };
    }]);


//Controller for contacts list and displaying contact
App.controller('ContactsCtrl', ['$scope', '$filter', 'AppFactory', 'ContactService', function ($scope, $filter, AppFactory, ContactService) {
        //Getting the contacts list
        AppFactory.getlist()
                // $http.get('contacts.json')
                .then(function (res) {

                    res.data.sort(ContactService.contactNameComparing);

                    $scope.nextId = ContactService.getMaxId(res.data) + 1;

                    //Getting the number of the contacts, and displaying on {{ numOfContact }}
                    $scope.numOfContacts = res.data.length;
                    //provide the contacts to the scope
                    $scope.letters = ContactService.createLetters(res);
                });
        //Event for contact selecting
        $scope.selectContact = function (contactIndex, letterIndex, $event) {
            //If a contact is selected, it will show the Edit button by removing the hidden bootstrap class
            angular.element(".editContact").removeClass("hidden");
            //   $(".editContact").removeClass("hidden"); //With jQuery

            //Copy to the displayed contact and the to be modified contact
            $scope.contact = angular.copy($scope.letters[letterIndex].contacts[contactIndex]);
            $scope.editedContact = angular.copy($scope.letters[letterIndex].contacts[contactIndex]);

            $scope.nextArrow($event); //Set arrow
        };
        //Setting the arrow next to the selected contact
        $scope.nextArrow = function ($event) {
            angular.element(".contact-arrow").css("top", angular.element($event.target).offset().top - 40);
        };
        //Adding a new contact
        $scope.addNewContact = function () {
            var newContact;

            //Define the new contact
            newContact = {
                name: $scope.newContactName,
                phone: $scope.newContactPhone,
                email: $scope.newContactEmail,
                id: $scope.nextId,
                img: 'img/profile.jpg'
            };

            //Add the new contact
            ContactService.addContact(newContact, $scope.letters);

            //Clear the new contact form
            $scope.newContactName = '';
            $scope.newContactPhone = '';
            $scope.newContactEmail = '';

            //Set the id for the next contact
            $scope.nextId++;

            //Increase the number of contracts
            $scope.numOfContacts++; //+1 for the contacts number
        };
        //Edit the contact
        $scope.modifyContact = function () {
            var firstLetter = $filter('uppercase')($scope.editedContact.name[0]),
                    letterObject;

            //Get the corresponding letter object
            for (var i = 0; i < $scope.letters.length; i++) {
                if ($scope.letters[i].letter === firstLetter) {
                    letterObject = $scope.letters[i];
                    break;
                }
            }

            //Find the contact and modify
            //+ modify the shown contact as well
            for (var i = 0; i < letterObject.contacts.length; i++) {
                if (letterObject.contacts[i].id === $scope.editedContact.id) {
                    letterObject.contacts[i].name = $scope.contact.name = $scope.editedContact.name;
                    letterObject.contacts[i].email = $scope.contact.email = $scope.editedContact.email;
                    letterObject.contacts[i].phone = $scope.contact.phone = $scope.editedContact.phone;
                }
            }
        };
    }]);
