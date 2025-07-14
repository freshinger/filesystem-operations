function showPasswordField() {
  const passwordCheckbox = document.getElementById("passwordProtection");
  const passwordField = document.getElementById("passwordField");
  if (passwordCheckbox.checked) {
    document.getElementById("password").removeAttribute("disabled");
    passwordField.style.display = "block";
  } else {
    document.getElementById("password").setAttribute("disabled", "true");
    passwordField.style.display = "none";
  }
}

document
  .getElementById("passwordProtection")
  .addEventListener("click", showPasswordField);
