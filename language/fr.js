var lang = {
	"_dateFormat" : "dd/mm/yyyy",
	"_timeFormat" : "HH:MM:ss",
	"_dateTimeFormat" : "dd/mm/yyyy HH:MM:ss",

	"Username" : "Nom d'utilisateur",
	"Email" : "Email",
	"Password" : "Mot de passe",
	"Submit" : "Envoyer"
};

exports.lang = lang;

exports.I = function(req){
	return (lang[req]) ? lang[req] : req;
}
