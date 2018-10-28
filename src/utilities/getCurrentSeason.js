export default () => {
    const date = new Date;
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return month < 9 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}

