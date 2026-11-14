import React from "react";

export const DriveEmptyIllustration: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center select-none text-center">
      {/* SVG Cat Illustration hugging file */}
      <svg
        className="w-56 h-48 md:w-64 md:h-52"
        viewBox="0 0 260 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft ground shadow */}
        <ellipse cx="130" cy="188" rx="72" ry="7" fill="#18191B" opacity="0.9" />

        {/* Back leg & paw */}
        <path
          d="M74 150 C70 162 72 178 78 186 C82 188 92 188 96 186 C98 180 94 168 88 156 Z"
          fill="#D95B24"
        />

        {/* Blue Document/File */}
        <g>
          {/* Main file body */}
          <path
            d="M136 102 L178 102 L198 122 L198 186 C198 188 196 190 194 190 L136 190 C134 190 132 188 132 186 L132 106 C132 104 134 102 136 102 Z"
            fill="#7CB8F8"
          />
          {/* Folded corner */}
          <path
            d="M178 102 L178 122 L198 122 Z"
            fill="#D5E7FC"
          />
          <path
            d="M178 102 L198 122"
            stroke="#5B9FE6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Cat Main Body (Orange arched back) */}
        <path
          d="M80 186 C74 165 72 125 90 95 C102 75 125 70 148 76 C144 86 142 98 143 110 C144 122 147 132 149 144 C151 155 152 170 151 186 C146 187 137 186 136 186 C137 172 136 156 133 144 C128 126 122 118 110 118 C98 118 90 135 88 155 C86 168 86 178 80 186 Z"
          fill="#F07137"
        />

        {/* Cat Head */}
        <path
          d="M142 85 C146 72 158 64 172 65 C186 66 195 76 196 90 C197 104 186 116 172 116 C158 116 145 106 142 85 Z"
          fill="#F07137"
        />

        {/* Cat Left Ear */}
        <path
          d="M152 70 L158 45 L170 66 Z"
          fill="#F07137"
        />
        <path
          d="M155 67 L160 52 L167 65 Z"
          fill="#3B1C10"
        />

        {/* Cat Right Ear */}
        <path
          d="M176 66 L192 48 L194 72 Z"
          fill="#F07137"
        />
        <path
          d="M180 65 L189 54 L191 70 Z"
          fill="#3B1C10"
        />

        {/* Cat Tail (curving gracefully upwards) */}
        <path
          d="M82 170 C72 140 68 100 84 72 C96 52 120 44 140 50 C146 52 148 57 144 60 C138 62 124 57 106 66 C90 74 80 92 82 118 C83 138 86 156 90 172 C88 174 84 173 82 170 Z"
          fill="#F07137"
        />

        {/* Cat Paws hugging the document */}
        {/* Left Paw */}
        <ellipse cx="140" cy="116" rx="9" ry="6" fill="#F07137" transform="rotate(-15 140 116)" />
        {/* Right Paw on top of document */}
        <path
          d="M172 112 C168 114 165 119 167 125 C169 130 175 132 181 129 C185 127 186 121 183 116 C180 112 175 111 172 112 Z"
          fill="#F07137"
        />

        {/* Happy Sleeping Eye */}
        <path
          d="M165 88 C168 83 174 83 177 88"
          stroke="#3B1C10"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Whiskers (White curved lines) */}
        <path
          d="M182 93 Q196 90 205 84"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M184 96 Q198 97 207 95"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M182 100 Q196 104 204 107"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Primary Heading */}
      <h2 className="text-xl font-medium text-[#E3E3E3] mt-3 tracking-tight">
        A place for all of your files
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-[#9AA0A6] mt-1.5 max-w-md font-normal">
        Drag your files and folders here or use the “New” button to upload
      </p>
    </div>
  );
};
