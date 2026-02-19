function Home() {
    return (
        <div className="home">
        {/*Block 1: NAVBAR*/}
        <nav className = "navbar">
            <div className ="logo">GoalGrocer</div>

            <div className ="navIcons">
                <button className="iconBtn">👤</button>
                <button className="iconBtn">🛒</button>
            </div>
        </nav>

            {/*Hero section (cenrtered) */}
            <div className ="heroSection">
             <h1 className="mainTitle">EAT CLEAN.REACH YOUR GOAL</h1>
                <p className="subTitle">Clean Food. Smart Choices</p>

            </div>
            

            {/*AI Prompt Search */}
            <div className= "searchRow">
            <input
            className ="promptInput"
            type ="text"
            placeholder="Tell us your goal"
            />
           <button className = "iconBtn" aria-label="Search">🔍</button>
           <label className="iconBtn" aria-label="Upload image">
            ⬆️
            <input type="file" hidden />
           </label>
           <button className="iconBtn" aria-label="Filter">⚙️</button>

            </div>

        </div>
    );
}

export default Home;