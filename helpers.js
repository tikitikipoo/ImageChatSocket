function render_date (target_date) {
  return new Date(("" + target_date).replace("GMT+0000","GMT-0900"));
};

function format_date ( target_date ) {
  return render_date(target_date).getFullYear() + "/"
      + ((+render_date(target_date).getMonth()) + 1) + "/"
      + render_date(target_date).getDate() + "("
      + (["日","月","火","水","木","金","土"])[render_date(target_date).getDay()] + ")"
      + render_date(target_date).getHours() + "時"
      + target_date.getMinutes() + "分"
      + target_date.getSeconds() + "秒";
}

exports.helpers = {
    render_date:render_date,
    format_date:format_date
};
