const lodash = require('lodash');
const sqlQuery = require('../config/db');
const studentService = require('../services/student');

module.exports = {
    getStudents: async (req, res) => {
        const result = await sqlQuery('SELECT * FROM student');
        return res.render('student/list', {
            activePath: '/students',
            students: result
        });
    },

    getNewStudent: async (req, res) => {
        return res.render('student/new', {
            activePath: '/students'
        });
    },

    postNewStudent: async (req, res) => {
        const name = req.body.name;
        await sqlQuery(`INSERT INTO student (name) values ('${name}')`);
        return res.redirect('/students');
    },

    getRegistration: async (req, res) => {
		let result;
		const studentID = req.params.id;
		const student = await sqlQuery(`SELECT * FROM student
			WHERE id=('${studentID}')`
		);

		const allowedCourses = await sqlQuery(`SELECT pre.course_id AS id
			FROM prerequisite AS pre
			INNER JOIN (SELECT course_id
				  FROM registration
				  WHERE student_id=('${studentID}')
					AND mark >= 60
				) AS passedCourses
			ON pre.pre_id=passedCourses.course_id`
		);
		console.log(allowedCourses.length);

		if (allowedCourses.length > 0) {
			result = await sqlQuery(`SELECT DISTINCT course.*
				FROM course, student
				WHERE ((('${allowedCourses[0].id}')=course.id
						  AND student.semester=course.semester
					  )
					OR (course.id NOT IN (SELECT course_id
										FROM prerequisite
									   )
								AND student.semester=course.semester
					)
				)`
			);
		} else {
			result = await sqlQuery(`SELECT DISTINCT course.*
				FROM course, student
				WHERE course.id NOT IN (SELECT course_id
									FROM prerequisite
								   )
					AND student.semester>=course.semester`
			);
		};


		return res.render('student/register', {
			activePath: '/students',
			student: student[0],
			allowedCourses: result
		});
	},

    postRegistration: async (req, res) => {
        // ..
    },

    getAddMarks: async (req, res) => {
        // ..
    },

    postAddMarks: async (req, res) => {
        // ..
    },

    getViewReport: async (req, res) => {
        // ..
    }
};
