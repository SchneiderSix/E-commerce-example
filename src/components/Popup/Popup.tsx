interface PopupProps {
  text: string,
  closePopup: () => void
}

export default function Popup({text, closePopup}: PopupProps) {
  return (
    <div className="flex justify-center items-center fixed inset-0 bg-black bg-opacity-50 z-10">
      <div className="bg-white p-6 rounded z-20">
        <h1>{text}</h1>
        <button className="float-right bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={closePopup}>Close</button>
      </div>
    </div>
  )
}
